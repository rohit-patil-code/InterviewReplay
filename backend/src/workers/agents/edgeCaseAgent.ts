import { BaseAgent } from "./baseAgent";
import { generateEdgeCasesPrompt } from "../prompts/edgeCasePrompts";

export interface EdgeCase {
    input: string;
    expected_output: string;
}

export class EdgeCaseAgent extends BaseAgent {
    constructor() {
        super(undefined, "You are an expert algorithm setter generating tricky edge cases.");
    }

    /**
     * Executes the LLM 1 (Edge Case) generation pipeline with reflection.
     */
    async generateEdgeCases(description: string): Promise<EdgeCase[]> {
        const prompt = generateEdgeCasesPrompt(description);

        // Ensure returning strict JSON
        const rawResponse = await this.generateWithReflection(prompt, 2, true);

        try {
            const parsedData = JSON.parse(rawResponse);

            let edgeCases: any = null;

            if (Array.isArray(parsedData)) {
                edgeCases = parsedData;
            } else if (parsedData && typeof parsedData === 'object') {
                if (Array.isArray(parsedData.edgeCases)) {
                    edgeCases = parsedData.edgeCases;
                } else {
                    // Search for any array value in the object
                    for (const value of Object.values(parsedData)) {
                        if (Array.isArray(value)) {
                            edgeCases = value;
                            break;
                        }
                    }
                }
            }

            if (!edgeCases || !Array.isArray(edgeCases)) {
                console.error("[EdgeCaseAgent] Raw response missing array:", rawResponse);
                throw new Error("Parsed data does not contain a valid edgeCases array.");
            }

            return edgeCases as EdgeCase[];
        } catch (error: any) {
            console.error("[EdgeCaseAgent] Failed parsing edge cases raw response:", rawResponse);
            throw new Error(`EdgeCaseAgent failed to parse final JSON response: ${error.message}`);
        }
    }
}
