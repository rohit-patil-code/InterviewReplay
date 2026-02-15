import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing from environment variables');
}

export const getSupabaseClient = (accessToken?: string) => {
    const options = accessToken ? {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    } : {};

    return createClient(supabaseUrl, supabaseKey, options);
};
