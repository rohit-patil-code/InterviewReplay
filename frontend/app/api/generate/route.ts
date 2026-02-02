import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { ProblemSchema } from "@/lib/schema";

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export const maxDuration = 60; // Allow up to 60 seconds for generation

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { memory, difficulty, company } = body;

        // Validate input basic presence
        if (!memory) {
            return NextResponse.json(
                { error: "Memory/Description is required" },
                { status: 400 }
            );
        }

        const systemPrompt = `
You are an expert "LeetCode Problem Architect".
Your goal is to take a user's messy, vague, or incomplete notes about a coding interview question they faced and reconstruct it into a polished, formal problem statement.

You MUST output ONLY valid JSON with NO markdown code blocks, NO extra text, and NO commentary. The JSON must have exactly this structure:

{
  "title": "string - problem title",
  "difficulty": "Easy|Medium|Hard",
  "company": "string - company name or 'Unknown' if not provided",
  "description": "string - full problem description in clean markdown",
  "constraints": ["string array - each constraint like '1 <= n <= 10^5'"],
  "examples": [
    {
      "input": "string",
      "output": "string - MUST BE STRING, not number",
      "explanation": "string - optional explanation"
    }
  ],
  "time_complexity": "string - e.g. 'O(n log n)'"
}

Rules:
1. Infer missing constraints, examples, and complexity from typical LeetCode problems.
2. ALL fields are REQUIRED (no undefined values).
3. example.output must be a STRING, even if it's a number like "5" or "true".
4. company and time_complexity must be provided (use defaults if unknown).
5. Difficulty must be one of: Easy, Medium, Hard

Input Context:
- Difficulty Estimate: ${difficulty || "Unknown"}
- Company: ${company || "Unknown"}
`;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const completion = await model.generateContent([
            {
                text: systemPrompt + `\n\nHere are my notes:\n\n${memory}`,
            },
        ]);

        const rawContent = completion.response.text();

        if (!rawContent) {
            throw new Error("No content received from AI");
        }

        // Parse JSON
        let parsedData;
        try {
            // Gemini might include markdown code blocks, so clean them up
            let cleanContent = rawContent.trim();
            if (cleanContent.startsWith("```json")) {
                cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
            } else if (cleanContent.startsWith("```")) {
                cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
            }
            parsedData = JSON.parse(cleanContent);
        } catch (e) {
            console.error("Failed to parse JSON from AI:", rawContent);
            return NextResponse.json(
                { error: "AI response was not valid JSON" },
                { status: 500 }
            );
        }

        // Validate against Schema
        const validationResult = ProblemSchema.safeParse(parsedData);

        if (!validationResult.success) {
            console.error("Schema validation failed:", validationResult.error);
            return NextResponse.json(
                { error: "AI generation did not match expected schema", details: validationResult.error },
                { status: 500 }
            );
        }

        return NextResponse.json(validationResult.data);

    } catch (error: any) {
        console.error("Error in /api/generate:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
