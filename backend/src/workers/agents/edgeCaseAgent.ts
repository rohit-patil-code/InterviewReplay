import { BaseAgent } from "./baseAgent";
import { generateEdgeCasesPrompt } from "../prompts/edgeCasePrompts";

export interface EdgeCase {
    input: string;
    expected_output: string;
}

export class EdgeCaseAgent extends BaseAgent {
    constructor() {
        super("gemini-2.5-flash", "You are an expert algorithm setter generating tricky edge cases.");
    }

    /**
     * Executes the LLM 1 (Edge Case) generation pipeline with reflection.
     */
    async generateEdgeCases(description: string): Promise<EdgeCase[]> {
        const prompt = generateEdgeCasesPrompt(description);

        // Ensure returning strict JSON
        const rawResponse = await this.generateWithReflection(prompt, 2, true);

        try {
            const edgeCases: EdgeCase[] = JSON.parse(rawResponse);
            return edgeCases;
        } catch (error: any) {
            throw new Error(`EdgeCaseAgent failed to parse final JSON response: ${error.message}`);
        }
    }
}
