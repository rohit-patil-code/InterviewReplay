"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginWithGoogle() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (data.url) {
        redirect(data.url);
    }

    if (error) {
        console.error("Google Login Error:", error);
        throw error;
    }
}

export async function sendOtp(email: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            // No link redirect needed for code flow usually, but we keep it clean
        },
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function verifyOtp(email: string, code: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
    });

    if (error) {
        return { error: error.message };
    }

    if (!data.user) {
        return { error: "Authentication failed." };
    }

    // Check Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single();

    if (!profile || !profile.full_name) {
        return { redirect: "/onboarding" };
    }

    return { redirect: "/dashboard" };
}
