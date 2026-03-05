import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

export class BaseAgent {
    protected genAI: GoogleGenerativeAI;
    protected model: GenerativeModel;

    constructor(modelName: string = "gemini-2.5-flash", systemInstruction?: string) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const config: any = { model: modelName };
        if (systemInstruction) config.systemInstruction = systemInstruction;

        this.model = this.genAI.getGenerativeModel(config);
    }

    /**
     * Executes an LLM prompt and includes a reflection loop that triggers a repair
     * prompt if an error occurs or JSON parsing fails.
     */
    async generateWithReflection(
        prompt: string,
        maxRetries: number = 2,
        isJsonFormat: boolean = true
    ): Promise<string> {
        let attempt = 0;
        let p = prompt;

        while (attempt <= maxRetries) {
            try {
                const config: any = {};
                if (isJsonFormat) {
                    config.generationConfig = { responseMimeType: "application/json" };
                }

                // If user wants JSON mode, override the model instance just for this call
                const tempModel = isJsonFormat
                    ? this.genAI.getGenerativeModel({ ...this.model, ...config })
                    : this.model;

                const result = await tempModel.generateContent(p);
                let text = result.response.text();

                if (isJsonFormat) {
                    // Strip potential markdown blocks wrapping JSON
                    text = text.trim();
                    if (text.startsWith('```json')) text = text.replace(/^```json\n?/, '').replace(/```\n?$/, '');
                    else if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/```\n?$/, '');

                    // Test parse to see if it throws
                    JSON.parse(text);
                }

                return text;
            } catch (error: any) {
                console.error(`[BaseAgent] Attempt ${attempt + 1} failed. Error:`, error.message);

                if (attempt === maxRetries) {
                    throw new Error(`Failed to generate valid response after ${maxRetries} retries. Last error: ${error.message}`);
                }

                // Reflection: Update prompt with instructions to fix the error
                console.log(`[BaseAgent] Triggering repair reflection for error...`);
                p = `The previous attempt to generate a response failed with the following error:\n"${error.message}"\n\nPlease fix the output accordingly and ensure it strictly follows the original prompt instructions.\n\nORIGINAL PROMPT:\n${prompt}`;

                attempt++;
            }
        }

        throw new Error("Unexpected end of reflection loop");
    }
}
