import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { ProblemSchema, ProblemData } from "../validations/problem";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Map your Zod schema directly to Gemini's expected SchemaType
const geminiProblemSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        title: {
            type: SchemaType.STRING,
            description: "The reconstructed title of the algorithmic problem"
        },
        difficulty: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["Easy", "Medium", "Hard"],
            description: "Estimated difficulty level"
        },
        company: {
            type: SchemaType.STRING,
            description: "The company associated with this problem, if known"
        },
        description: {
            type: SchemaType.STRING,
            description: "Review-ready problem description in Markdown format. DO NOT write Examples or Constraints here."
        },
        constraints: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of numerical constraints (e.g., '1 <= N <= 10^5')"
        },
        examples: {
            type: SchemaType.ARRAY,
            description: "2-3 input/output examples to clarify the problem",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    input: { type: SchemaType.STRING },
                    output: { type: SchemaType.STRING },
                    explanation: { type: SchemaType.STRING }
                },
                required: ["input", "output"]
            }
        },
        time_limit_ms: {
            type: SchemaType.INTEGER,
            description: `Time limit per test case in milliseconds for a Java solution. Set this strictly based on the problem constraints and the expected OPTIMAL time complexity. Use these reference values: O(n) on n<=10^5: 500ms | O(n log n) on n<=10^5: 1000ms | O(n log n) on n<=10^6: 2000ms | O(n^2) on n<=10^3: 1000ms | O(n^2) on n<=10^4: 5000ms | O(2^n) on n<=20: 3000ms | O(n) tree/graph traversal on n<=10^4: 500ms. Minimum 100ms, maximum 15000ms.`
        }
    },
    required: ["title", "difficulty", "company", "description", "constraints", "examples", "time_limit_ms"]
};

// 2. Initialize the model with the strict response schema
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiProblemSchema
    }
});

interface GenerateProblemInput {
    memory: string;
    difficulty?: string;
    company?: string;
}

export const generateProblem = async (input: GenerateProblemInput): Promise<ProblemData> => {
    const { memory, difficulty, company } = input;

    const systemPrompt = `You are an expert "LeetCode Problem Architect".
Your goal is to take a user's messy, vague, or incomplete notes about a coding interview question they faced and reconstruct it into a polished, formal problem statement.

CRITICAL INSTRUCTIONS FOR PROBLEM QUALITY:
- The description MUST be extremely clear. It must be written exactly like a typical coding platform problem description (just the narrative and objective).
- Explanations must ONLY demonstrate how the input maps to the output manually. DO NOT reveal the optimal algorithm, data structures, approach, or solution to the user in the explanation or description.
- Infer missing constraints, examples, and complexity from typical competitive programming problems.
- Example outputs MUST be strings, even if it's a number like "5" or "true".
- NO INTERNAL DOUBLE QUOTES: If you need to quote a string inside the description or explanations, use single quotes (e.g., 'abc') or backticks (\`abc\`).
- NO PHYSICAL LINE BREAKS in JSON strings. Use literal '\\n' for newlines.
- 'time_limit_ms': Set the per-test-case time limit (Java baseline, in ms) based on the problem's constraints and the OPTIMAL algorithm's expected complexity. Reference: O(n) on n<=10^5 → 500ms, O(n log n) on n<=10^5 → 1000ms, O(n^2) on n<=10^3 → 1000ms.

Input Context:
- Difficulty Estimate: ${difficulty || "Unknown"}
- Company: ${company || "Unknown"}`;

    const start = performance.now();

    // 3. Single API pass!
    const result = await model.generateContent(`SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER INPUT:\n${memory}`);

    const end = performance.now();
    console.log(`[aiService] Time taken (AI single-pass generation): ${Math.round(end - start)}ms`);

    const usage = result.response.usageMetadata;
    if (usage) {
        console.log(`[aiService] Token Usage for "${difficulty || 'Unknown'}" Problem:`);
        console.log(`  -> Prompt Tokens (Input):     ${usage.promptTokenCount}`);
        console.log(`  -> Candidate Tokens (Output): ${usage.candidatesTokenCount}`);
        console.log(`  -> Total Tokens:              ${usage.totalTokenCount}`);
    }

    const rawContent = result.response.text();

    if (!rawContent) {
        throw new Error("No content received from AI");
    }

    let parsedData;
    try {
        parsedData = JSON.parse(rawContent);
    } catch (e) {
        console.error("========== RAW GEMINI OUTPUT FAILED TO PARSE ==========\n", rawContent);
        throw new Error("Gemini response was not valid JSON despite schema constraints.");
    }

    // 4. Final safety net: Validate the perfectly structured JSON against Zod
    const validationResult = ProblemSchema.safeParse(parsedData);

    if (!validationResult.success) {
        console.error("Schema validation failed on AI output:", validationResult.error);
        throw new Error("AI generation did not match the required Zod schema structure.");
    }

    console.log("[aiService] Problem successfully reconstructed and validated in a single pass!");
    return validationResult.data;
}; 