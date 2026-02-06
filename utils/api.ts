
import { createClient } from "@/services/supabase/client";

const supabase = createClient();

export const uploadFile = async (bucketName: string, file: File, filePath: string): Promise<{success: boolean; filePath: string; error?: string}> => {

      const {data, error} = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })
      if (error) {
      return {
      success: false,
      filePath: "",
      path: "",
      error: error.message,
    }
      }
      console.log("upload success");

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return {success: true, filePath, error: undefined}
};

export const insertFileMetadata = async (uploaderId: string, fileName: string, filePath: string, fileHash: string, fileNonce): Promise<{success: boolean; error?: string}> => {
  const {error } = await supabase.schema("api").from("file_metadata").insert({
    uploader_id: uploaderId,
    file_name: fileName,
    file_path: filePath,
    file_hash: fileHash,
    file_nonce: fileNonce
  })

  if(error) {
    return {
      success: false,
      error: error.message
    }
  }
  return { success: true, error: undefined};

}
