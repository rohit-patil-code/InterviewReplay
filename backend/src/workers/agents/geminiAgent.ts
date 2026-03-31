import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiAgent {
    protected genAI: GoogleGenerativeAI;
    protected model: any;
    protected systemInstruction?: string;

    constructor(modelName: string = "gemini-2.5-flash", systemInstruction?: string) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: modelName
        });
        this.systemInstruction = systemInstruction;
    }

    /**
     * Executes an LLM prompt using Google Gemini SDK with a reflection loop.
     */
    async generateWithReflection(
        prompt: string,
        maxRetries: number = 2,
        isJsonFormat: boolean = true,
        validationFn?: (parsed: any) => void
    ): Promise<string> {
        let attempt = 0;
        let p = prompt;

        while (attempt <= maxRetries) {
            try {
                // Prepend system instructions to the prompt (matching aiService.ts)
                const fullPrompt = this.systemInstruction
                    ? `SYSTEM INSTRUCTION:\n${this.systemInstruction}\n\nUSER PROMPT:\n${p}`
                    : p;

                const result = await this.model.generateContent({
                    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        responseMimeType: isJsonFormat ? "application/json" : "text/plain",
                    }
                });

                const response = result.response;
                let text = response.text();

                if (isJsonFormat) {
                    // Gemini 1.5 JSON mode is usually very clean, but safely trim any markdown just in case
                    text = text.trim();
                    if (text.startsWith('```json')) text = text.replace(/^```json\n?/, '').replace(/```\n?$/, '');
                    else if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/```\n?$/, '');

                    const parsed = JSON.parse(text);
                    if (validationFn) {
                        validationFn(parsed);
                    }
                }

                return text;
            } catch (error: any) {
                console.error(`[GeminiAgent] Attempt ${attempt + 1} failed. Error:`, error.message);

                if (attempt === maxRetries) {
                    throw new Error(`Gemini failed to generate valid response after ${maxRetries} retries. Last error: ${error.message}`);
                }

                console.log(`[GeminiAgent] Triggering repair reflection for error...`);
                p = `The previous attempt to generate a response failed with the following error:\n"${error.message}"\n\nPlease fix the output accordingly and ensure it strictly follows the original prompt instructions.\n\nORIGINAL PROMPT:\n${prompt}`;

                attempt++;
            }
        }

        throw new Error("Unexpected end of reflection loop in GeminiAgent");
    }
}
