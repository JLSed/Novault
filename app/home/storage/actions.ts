"use server";

import { createClient } from "@/services/supabase/server";

/** Represents file metadata returned from the database */
export interface FileMetadata {
  file_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  file_nonce: string;
  uploaded_at: string;
}

/** Result shape for fetching user files */
export interface GetUserFilesResult {
  success: boolean;
  files: FileMetadata[];
  error?: string;
}

/**
 * Fetches all files belonging to the currently authenticated user.
 *
 * @returns Promise resolving to the list of user files or an error
 */
export async function getUserFiles(): Promise<GetUserFilesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[getUserFiles] No authenticated user found");
    return { success: false, files: [], error: "Not authenticated" };
  }

  console.log("[getUserFiles] Fetching files for user:", user.id);

  const { data, error } = await supabase
    .schema("api")
    .from("file_metadata")
    .select(
      "file_id, uploader_id, file_name, file_path, file_hash, file_nonce, uploaded_at",
    )
    .eq("uploader_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("[getUserFiles] Error fetching files:", error);
    return { success: false, files: [], error: error.message };
  }

  console.log("[getUserFiles] Found", data?.length ?? 0, "files");

  return { success: true, files: (data as FileMetadata[]) ?? [] };
}

/** Represents a file DEK (Data Encryption Key) entry */
export interface FileDek {
  key_id: string;
  file_id: string;
  owner_id: string;
  encrypted_dek: string;
  dek_nonce: string;
  ephemeral_public_key: string;
  created_at: string;
}

/** Result shape for fetching a file DEK */
export interface GetFileDekResult {
  success: boolean;
  dek: FileDek | null;
  error?: string;
}

/**
 * Fetches the file DEK for a given file belonging to the current user.
 *
 * @param fileId - The UUID of the file
 * @returns Promise resolving to the file DEK or an error
 */
export async function getFileDek(fileId: string): Promise<GetFileDekResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[getFileDek] No authenticated user found");
    return { success: false, dek: null, error: "Not authenticated" };
  }

  console.log("[getFileDek] Fetching DEK for file:", fileId, "user:", user.id);

  const { data, error } = await supabase
    .schema("api")
    .from("file_dek")
    .select(
      "key_id, file_id, owner_id, encrypted_dek, dek_nonce, ephemeral_public_key, created_at",
    )
    .eq("file_id", fileId)
    .eq("owner_id", user.id)
    .single();

  if (error) {
    console.error("[getFileDek] Error fetching file DEK:", error);
    return { success: false, dek: null, error: error.message };
  }

  console.log("[getFileDek] DEK found for file:", fileId);
  return { success: true, dek: data as FileDek };
}

/** Result shape for fetching user secrets for decryption */
export interface GetUserSecretsResult {
  success: boolean;
  secrets: {
    encrypted_private_key: string;
    public_key: string;
    pk_salt: string;
    pk_nonce: string;
  } | null;
  error?: string;
}

/**
 * Fetches the current user's secrets needed for file decryption.
 *
 * @returns Promise resolving to user secrets or an error
 */
export async function getUserSecretsForDecryption(): Promise<GetUserSecretsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[getUserSecretsForDecryption] No authenticated user found");
    return { success: false, secrets: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .schema("api")
    .from("user_secrets")
    .select("encrypted_private_key, public_key, pk_salt, pk_nonce")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("[getUserSecretsForDecryption] Error:", error);
    return { success: false, secrets: null, error: error.message };
  }

  return {
    success: true,
    secrets: data as GetUserSecretsResult["secrets"],
  };
}
