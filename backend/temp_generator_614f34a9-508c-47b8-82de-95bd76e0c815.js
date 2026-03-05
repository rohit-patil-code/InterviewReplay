const fs = require('fs');
const path = require('path');

// Optimal solution for "Longest Substring Without Repeating Characters"
// This uses a sliding window approach with a Set for O(N) time complexity.
function lengthOfLongestSubstring(s) {
    let maxLength = 0;
    let left = 0;
    const charSet = new Set();

    for (let right = 0; right < s.length; right++) {
        // If the character at `right` is already in the set, it means it's a repeat.
        // Shrink the window from the `left` until the repeating character is removed.
        while (charSet.has(s[right])) {
            charSet.delete(s[left]);
            left++;
        }
        // Add the current character to the set and expand the window to the right.
        charSet.add(s[right]);
        // Update the maximum length found so far.
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}

// UNIVERSAL GENERATION INSTRUCTION FRAMEWORK

// STEP 1 (Identify):
// The input for this problem is a String.

// STEP 2 (Extract Bounds):
// Constraints for string length (N) can vary, but for TLE testing, we aim for large N.
// Common N for TLE is up to 5 * 10^4 or 10^5.
// Characters typically include English letters, digits, symbols, and spaces.
const MAX_STRING_LENGTH = 5 * 10**4; // Maximum string length for massive inputs
const MIN_STRING_LENGTH = 0; // Minimum string length
// A diverse pool of characters to allow for varied test cases
const CHAR_POOL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~` ';

// STEP 3 (Write Generators):
// Helper function to generate a random string of a given length from a character pool.
function generateRandomString(length, charPool) {
    let result = '';
    const poolLength = charPool.length;
    for (let i = 0; i < length; i++) {
        result += charPool.charAt(Math.floor(Math.random() * poolLength));
    }
    return result;
}

// Helper function to generate a string by repeating a pattern.
// Useful for creating strings with controlled repetition or unique character sequences.
function generateRepeatingPatternString(length, pattern) {
    let result = '';
    while (result.length < length) {
        result += pattern;
    }
    return result.substring(0, length);
}

// CRITICAL PATH INSTRUCTION:
// Absolute path where input and output files will be saved.
const OUTPUT_DIR = "E:/Projects/InterviewReplay/backend";

// Ensure the output directory exists. If not, create it recursively.
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// STEP 4: Use the helper functions to build 15 large test cases.
function generateAllTestCases() {
    console.log("Generating test cases...");

    const testCases = [];

    // Test Case 1: Empty string (edge case)
    testCases.push({ input: "" });
    // Test Case 2: Single character string (edge case)
    testCases.push({ input: "a" });
    // Test Case 3: Long string with all identical characters (max length 1)
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH, "a") });
    // Test Case 4: Long string with alternating characters (max length 2, e.g., "ab")
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH, "ab") });
    // Test Case 5: Long string repeating the entire character pool (max length = CHAR_POOL.length)
    // This stresses the sliding window's ability to expand to its maximum without repeats.
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH, CHAR_POOL) });
    // Test Case 6: Long string with purely random characters (typical stress test)
    testCases.push({ input: generateRandomString(MAX_STRING_LENGTH, CHAR_POOL) });
    // Test Case 7: Moderately long string with purely random characters
    testCases.push({ input: generateRandomString(Math.floor(MAX_STRING_LENGTH / 2), CHAR_POOL) });
    // Test Case 8: Long string repeating a pattern that has a unique substring of moderate length (e.g., "abcdefg")
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH, "abcdefg") });
    // Test Case 9: Long string repeating all 26 lowercase English letters (max length 26)
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH, "abcdefghijklmnopqrstuvwxyz") });
    // Test Case 10: Specific LeetCode-like repeating pattern: "pwwkew" where longest is "wke" (3)
    testCases.push({ input: "pwwkew".repeat(Math.ceil(MAX_STRING_LENGTH / 6)).substring(0, MAX_STRING_LENGTH) });
    // Test Case 11: Another LeetCode-like repeating pattern: "dvdf" where longest is "vdf" (3)
    testCases.push({ input: "dvdf".repeat(Math.ceil(MAX_STRING_LENGTH / 4)).substring(0, MAX_STRING_LENGTH) });
    // Test Case 12: Long string using only digits and symbols from the CHAR_POOL
    testCases.push({ input: generateRandomString(MAX_STRING_LENGTH, "0123456789!@#$%^&*") });
    // Test Case 13: Long string with many spaces and short unique sequences
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH, " a b c d e f g h i j k l m n o p q r s t u v w x y z ") });
    // Test Case 14: Long string where the longest substring is at the very beginning, followed by many repeats
    testCases.push({ input: "abcdefghijklmnopqrstuvwxyz0123456789" + generateRepeatingPatternString(MAX_STRING_LENGTH - 36, "aaaaaaaaa") });
    // Test Case 15: Long string where the longest substring is at the very end, preceded by many repeats
    testCases.push({ input: generateRepeatingPatternString(MAX_STRING_LENGTH - 36, "bbbbbbbbb") + "abcdefghijklmnopqrstuvwxyz0123456789" });

    // Iterate through generated test cases, run solution, and save inputs/outputs
    for (let i = 0; i < testCases.length; i++) {
        const input = testCases[i].input;
        const output = lengthOfLongestSubstring(input); // Calculate the expected output

        const inputFileName = path.join(OUTPUT_DIR, `input_${i + 1}.txt`);
        const outputFileName = path.join(OUTPUT_DIR, `output_${i + 1}.txt`);

        // Use fs.writeFileSync (synchronous) to save files as required
        fs.writeFileSync(inputFileName, input.toString(), 'utf8');
        fs.writeFileSync(outputFileName, output.toString(), 'utf8');

        console.log(`Generated ${inputFileName} and ${outputFileName}`);
    }
    console.log("All 15 massive test cases generated successfully.");
}

// CRITICAL EXECUTION INSTRUCTION:
// Invoke the generation logic at the bottom of the script.
generateAllTestCases();