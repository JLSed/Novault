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
