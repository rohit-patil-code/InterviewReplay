import { getSupabaseClient } from '../config/supabase';

interface UpdateProfileInput {
    fullName: string;
    token: string;
}

export const updateProfile = async (input: UpdateProfileInput): Promise<boolean> => {
    const { fullName, token } = input;
    const supabase = getSupabaseClient(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: fullName,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        console.error("Profile Update Error:", error);
        throw new Error("Failed to update profile");
    }

    // Also update metadata so it persists in session seamlessly if needed
    const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
    });

    if (updateError) {
        console.warn("User Metadata Update Error:", updateError);
        // Not critical enough to fail the whole request?
    }

    return true;
};
