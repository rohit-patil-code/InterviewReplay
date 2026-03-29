import Groq from "groq-sdk";

export class BaseAgent {
    protected groq: Groq;
    protected modelName: string;
    protected systemInstruction?: string;

    constructor(modelName: string = "llama-3.3-70b-versatile", systemInstruction?: string) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not defined in environment variables");
        }

        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        this.modelName = modelName;
        this.systemInstruction = systemInstruction;
    }

    /**
     * Executes an LLM prompt and includes a reflection loop that triggers a repair
     * prompt if an error occurs or JSON parsing fails.
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
                const messages: any[] = [];
                if (this.systemInstruction) {
                    messages.push({ role: "system", content: this.systemInstruction });
                }
                messages.push({ role: "user", content: p });

                const responseFormat = isJsonFormat ? { type: "json_object" } : undefined;

                const completion = await this.groq.chat.completions.create({
                    messages: messages,
                    model: this.modelName,
                    response_format: responseFormat as any
                });

                let text = completion.choices[0]?.message?.content || "";

                if (isJsonFormat) {
                    // Strip potential markdown blocks wrapping JSON
                    text = text.trim();
                    if (text.startsWith('```json')) text = text.replace(/^```json\n?/, '').replace(/```\n?$/, '');
                    else if (text.startsWith('```')) text = text.replace(/^```\n?/, '').replace(/```\n?$/, '');

                    // Test parse to see if it throws
                    const parsed = JSON.parse(text);
                    if (validationFn) {
                        validationFn(parsed);
                    }
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
