import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProblemSchema, ProblemData } from "../validations/problem";
import JSON5 from 'json5';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
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
- The description MUST be extremely clear. It must be written exactly like a LeetCode problem description (just the narrative and objective).
- DO NOT include "Examples", "Constraints", or "Follow-up" sections inside the \`description\` string. These belong strictly in their separate JSON arrays.
- STRICT RULE ON EXPLANATIONS: Explanations must ONLY demonstrate how the input maps to the output manually. DO NOT reveal the optimal algorithm, data structures, approach, or solution to the user in the explanation or description. This is a practice problem, do not spoil it.

You MUST output ONLY valid JSON with NO markdown code blocks, NO extra text, and NO commentary. The JSON must have exactly this structure:

{
  "title": "string - problem title",
  "difficulty": "Easy|Medium|Hard",
  "company": "string - company name or 'Unknown' if not provided",
  "description": "string - The core problem narrative and rules in clean markdown. DO NOT write 'Examples:' or 'Constraints:' sections here. Just explain the story, what the inputs represent, and what needs to be returned.",
  "constraints": ["string array - each constraint like '1 <= s.length <= 10^5'"],
  "examples": [
    {
      "input": "string - clearly formatted, e.g., 's = \`abcabcbb\`'",
      "output": "string - MUST BE STRING, not number",
      "explanation": "string - A short, concise explanation (1 to 2 sentences MAX) of why the output is correct, exactly like LeetCode. Do not over-explain."
    }
  ],
}

Rules:
1. Infer missing constraints, examples, and complexity from typical LeetCode problems.
2. ALL fields are REQUIRED (no undefined values).
3. example.output must be a STRING, even if it's a number like "5" or "true".
4. example.explanation MUST BE BRIEF (1-2 sentences maximum). If the example is completely self-explanatory, provide a simple 1-line summary like "The longest substring is 'abc', with length 3." Do not write a novel.
5. company and time_complexity must be provided (use defaults if unknown).
6. Difficulty must be one of: Easy, Medium, Hard.
7. NO INTERNAL DOUBLE QUOTES: If you need to quote a string or variable inside the description, input, output, or explanation, you MUST use single quotes (e.g., 'abc') or backticks (\`abc\`). NEVER use raw double quotes inside a JSON string value.
8. NO PHYSICAL LINE BREAKS: You MUST NOT use literal/physical line breaks or press 'Enter' inside any JSON string values. If you need a new line in the description, you must type the exact literal characters '\\n'.
9. NO DUPLICATION: Never put examples, test cases, or constraints inside the description text.

Input Context:
- Difficulty Estimate: ${difficulty || "Unknown"}
- Company: ${company || "Unknown"}`;

    const start = performance.now();
    const result = await model.generateContent(`SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER INPUT:\n${memory}`);
    const end = performance.now();
    console.log(`Time taken (AI generation): ${end - start}ms`);

    const rawContent = result.response.text();

    if (!rawContent) {
        throw new Error("No content received from AI");
    }

    // Parse JSON
    let parsedData;
    try {
        let cleanContent = rawContent.trim();

        // Find the absolute first and last curly braces
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            // Extract ONLY what is between the braces
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        }

        parsedData = JSON.parse(cleanContent);

    } catch (e) {
        // THIS IS THE CRITICAL DEBUG LOG
        console.error("========== RAW GEMINI OUTPUT FAILED TO PARSE ==========\n", rawContent);
        console.error("=======================================================");
        throw new Error("Gemini response was not valid JSON");
    }

    // --- SECOND PASS: Gemini Validation ---
    console.log("Starting Gemini validation pass...");

    const validationPrompt = `You are a strict technical reviewer for LeetCode-style problems.
Your goal is to review a previously generated problem description and verify its correctness based on the original user memory.
Specifically, verify:
1. Is the problem description factually correct based on the user's initial notes?
2. Are the examples outputting the correct result for their given inputs according to the problem logic?
3. Are the explanations of the examples accurate?
4. Are the constraints logically sound and appropriate for the problem?

You MUST fix any logical or output errors you find, and you MUST return the corrected problem using the EXACT same JSON schema as the input. DO NOT wrap with markdown backticks or include any conversational text.

ORIGINAL USER MEMORY:
"""
${memory}
"""

PREVIOUSLY GENERATED PROBLEM (TO VERIFY/FIX):
"""
${JSON.stringify(parsedData, null, 2)}
"""

If it is already perfectly correct, just return the exact same JSON. Otherwise, return the corrected JSON.`;

    const cStartTime = performance.now();
    const geminiValidationResult = await model.generateContent(validationPrompt);
    const cEndTime = performance.now();
    console.log(`Time taken (Gemini Validation): ${cEndTime - cStartTime}ms`);

    const geminiRawContent = geminiValidationResult.response.text();
    if (!geminiRawContent) {
        throw new Error("No content received from Gemini validation pass");
    }

    let finalParsedData;
    try {
        let cleanContent = geminiRawContent.trim();
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        }
        finalParsedData = JSON.parse(cleanContent);
    } catch (e) {
        console.error("========== RAW GEMINI VALIDATION OUTPUT FAILED TO PARSE ==========\n", geminiRawContent);
        console.error("==================================================================");
        throw new Error("Gemini validation response was not valid JSON");
    }

    // Validate against Schema
    const validationResult = ProblemSchema.safeParse(finalParsedData);

    if (!validationResult.success) {
        console.error("Schema validation failed on Cerebras output:", validationResult.error);
        throw new Error("AI generation did not match expected schema after validation pass");
    }
    console.log("Multi-pass AI generation successful!");
    return validationResult.data;
};
