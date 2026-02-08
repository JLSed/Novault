import { createClient } from "@/services/supabase/client";

const supabase = createClient();

export const uploadFile = async (
  bucketName: string,
  file: File | Uint8Array<ArrayBufferLike>,
  filePath: string,
): Promise<{ success: boolean; filePath: string; error?: string }> => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
  if (error) {
    return {
      success: false,
      filePath: "",
      error: error.message,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(data.path);
  console.log(publicUrl);

  return { success: true, filePath: publicUrl, error: undefined };
};

export const insertFileMetadata = async (
  uploaderId: string,
  fileName: string,
  filePath: string,
  fileHash: string,
  fileNonce: string,
  encryptedDek: string,
  dekNonce: string,
  ephemeralPublicKey: string,
): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase
    .schema("api")
    .rpc("upload_encrypted_file", {
      p_file_name: fileName,
      p_file_path: filePath,
      p_file_hash: fileHash,
      p_file_nonce: fileNonce,
      p_encrypted_dek: encryptedDek,
      p_dek_nonce: dekNonce,
      p_ephemeral_public_key: ephemeralPublicKey,
    });

  if (data) {
    console.log(data);
  }

  if (error) {
    console.error("Error inserting file metadata:", error);
    return {
      success: false,
      error: error.message,
    };
  }
  return { success: true, error: undefined };
};
