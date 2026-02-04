"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface StorageBucketUploaderProps {
  bucketName?: string;
}

interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Test component for uploading files to a Supabase storage bucket.
 * This component allows selecting a file and uploading it to the specified bucket.
 */
export default function StorageBucketUploader({
  bucketName = "storage",
}: StorageBucketUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [customPath, setCustomPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles file selection from the file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    console.log("[StorageBucketUploader] File selected:", selectedFile?.name);
    setFile(selectedFile);
    setResult(null);
  };

  /**
   * Uploads the selected file to the Supabase storage bucket
   */
  const handleUpload = async () => {
    if (!file) {
      console.log("[StorageBucketUploader] No file selected");
      setResult({ success: false, error: "Please select a file to upload" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("[StorageBucketUploader] Starting upload...");
      console.log("[StorageBucketUploader] Bucket:", bucketName);
      console.log("[StorageBucketUploader] File name:", file.name);
      console.log("[StorageBucketUploader] File size:", file.size, "bytes");
      console.log("[StorageBucketUploader] File type:", file.type);

      const supabase = createClient();

      // Generate file path - use custom path or default to timestamp + filename
      const timestamp = Date.now();
      // Ensure path starts with 'files' folder as required by RLS policy: (storage.foldername(name))[1] = 'files'
      const filePath = customPath
        ? `${customPath}/${file.name}`
        : `files/${timestamp}_${file.name}`;

      console.log("[StorageBucketUploader] Upload path:", filePath);

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("[StorageBucketUploader] Upload error:", error);
        throw error;
      }

      console.log("[StorageBucketUploader] Upload successful:", data);

      // Get public URL (if bucket is public)
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(data.path);

      console.log("[StorageBucketUploader] Public URL:", publicUrl);

      setResult({
        success: true,
        path: data.path,
        publicUrl: publicUrl,
      });
    } catch (error) {
      console.error("[StorageBucketUploader] Error:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets the component state
   */
  const handleReset = () => {
    setFile(null);
    setResult(null);
    setCustomPath("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("[StorageBucketUploader] State reset");
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Storage Bucket Uploader Test
      </h2>

      <div className="space-y-4">
        {/* Bucket Name Display */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Bucket
          </label>
          <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {bucketName}
          </div>
        </div>

        {/* Custom Path Input */}
        <div>
          <label
            htmlFor="customPath"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Custom Path (optional)
          </label>
          <input
            type="text"
            id="customPath"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="e.g., files/documents (must start with files/)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* File Input */}
        <div>
          <label
            htmlFor="fileInput"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Select File
          </label>
          <input
            type="file"
            id="fileInput"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:file:bg-blue-900 dark:file:text-blue-300"
          />
        </div>

        {/* Selected File Info */}
        {file && (
          <div className="rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-900/30">
            <p className="font-medium text-blue-800 dark:text-blue-300">
              Selected File:
            </p>
            <p className="text-blue-700 dark:text-blue-400">
              Name: {file.name}
            </p>
            <p className="text-blue-700 dark:text-blue-400">
              Size: {(file.size / 1024).toFixed(2)} KB
            </p>
            <p className="text-blue-700 dark:text-blue-400">
              Type: {file.type || "Unknown"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Reset
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`rounded-md p-4 ${
              result.success
                ? "bg-green-50 dark:bg-green-900/30"
                : "bg-red-50 dark:bg-red-900/30"
            }`}
          >
            <p
              className={`font-medium ${
                result.success
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}
            >
              {result.success ? "✓ Upload Successful!" : "✗ Upload Failed"}
            </p>

            {result.success && (
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-green-700 dark:text-green-400">
                  <span className="font-medium">Path:</span> {result.path}
                </p>
                {result.publicUrl && (
                  <p className="text-green-700 dark:text-green-400">
                    <span className="font-medium">Public URL:</span>{" "}
                    <a
                      href={result.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all underline hover:text-green-800 dark:hover:text-green-300"
                    >
                      {result.publicUrl}
                    </a>
                  </p>
                )}
              </div>
            )}

            {result.error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Error: {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
