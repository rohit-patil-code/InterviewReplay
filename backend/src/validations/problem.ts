import { z } from "zod";

export const ProblemSchema = z.object({
    title: z.string().describe("The reconstructed title of the algorithmic problem"),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).describe("Estimated difficulty level"),
    company: z.string().describe("The company associated with this problem, if known"),
    description: z.string().describe("Review-ready problem description in Markdown format"),
    constraints: z.array(z.string()).describe("List of numerical constraints (e.g., '1 <= N <= 10^5')"),
    examples: z.array(
        z.object({
            input: z.string(),
            output: z.string(),
            explanation: z.string().optional(),
        })
    ).describe("2-3 input/output examples to clarify the problem"),
    time_limit_ms: z.number().int().min(100).max(15000)
        .describe("Per-test time limit in ms for a Java solution. 100–15000."),
});

export type ProblemData = z.infer<typeof ProblemSchema>;
