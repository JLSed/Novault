"use server";

import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";

export interface UserProfile {
  user_id: string;
  role: string;
  created_at: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}

export interface UserSecret {
  user_id: string;
  encrypted_private_key: string;
  public_key: string;
  pk_salt: string;
  pk_nonce: string;
  created_at: string;
}

export interface SaveUserSecretsInput {
  userId: string;
  encryptedPrivateKey: string;
  publicKey: string;
  pkSalt: string;
  pkNonce: string;
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
    encrypted_private_key: input.encryptedPrivateKey,
    public_key: input.publicKey,
    pk_salt: input.pkSalt,
    pk_nonce: input.pkNonce,
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
