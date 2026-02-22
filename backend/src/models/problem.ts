export interface Problem {
    id: string;
    user_id: string;
    title: string;
    company: string;
    difficulty: string;
    original_input: any; // JSON
    ai_output: any;      // JSON
    created_at: Date;
    updated_at: Date;
}
