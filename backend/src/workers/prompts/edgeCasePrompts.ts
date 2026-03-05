export const generateEdgeCasesPrompt = (description: string) => `
You are an expert algorithm setter. Given the problem below, generate exactly 3 tricky edge cases.
Return ONLY a strict JSON array of objects with keys "input" (string) and "expected_output" (string). 
DO NOT WRAP WITH MARKDOWN BACKTICKS.

PROBLEM:
"""
${description}
"""
`;
