"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export interface UserProfile {
  user_id: string;
  role: string;
  created_at: string;
}

export interface UserSecret {
  user_id: string;
  salt: string;
  encrypted_master_key: string;
  mk_nonce: string;
  created_at: string;
  updated_at: string;
}

export interface SaveUserSecretsInput {
  userId: string;
  salt: string;
  encryptedMasterKey: string;
  nonce: string;
  authTag: string;
}

export interface SaveUserSecretsResult {
  success: boolean;
  error?: string;
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .schema("api")
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return profile as UserProfile;
}

export async function getUserSecrets(
  userId: string,
): Promise<UserSecret | null> {
  const supabase = await createClient();

  const { data: secrets, error } = await supabase
    .schema("api")
    .from("user_secrets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 means no rows found, which is expected for new users
    if (error.code !== "PGRST116") {
      console.error("Error fetching user secrets:", error);
    }
    return null;
  }

  return secrets as UserSecret;
}

export async function saveUserSecrets(
  input: SaveUserSecretsInput,
): Promise<SaveUserSecretsResult> {
  const supabase = await createClient();

  const { error } = await supabase.schema("api").from("user_secrets").insert({
    user_id: input.userId,
    salt: input.salt,
    encrypted_master_key: input.encryptedMasterKey,
    mk_nonce: input.nonce,
  });

  if (error) {
    console.error("Error saving user secrets:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
