"use client";

import { FileText } from "lucide-react";
import { FileMetadata } from "@/app/home/storage/actions";

/** Props for the FileViewer component */
interface FileViewerProps {
  files: FileMetadata[];
}

/**
 * Formats a date string into a readable format (e.g. "Jan 29, 2024").
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Extracts the folder name from a file path.
 * Returns the parent directory name or "My Files" as default.
 *
 * @param filePath - The storage path of the file
 * @returns The folder name
 */
function getFolderName(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  if (parts.length > 1) {
    return parts[parts.length - 2];
  }
  return "My Files";
}

/**
 * Extracts the file extension from a filename.
 *
 * @param fileName - The name of the file
 * @returns The lowercase extension without the dot, or empty string
 */
function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return fileName.substring(dotIndex + 1).toLowerCase();
}

/**
 * FileViewer displays a list of user files in a clean table-like layout.
 * Shows file name, folder, size, and upload date.
 */
export default function FileViewer({ files }: FileViewerProps) {
  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No files yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Upload your first file to get started. All files are encrypted
            client-side before upload.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="py-4 border-b border-gray-100">
        <h1 className="font-semibold text-foreground">Files</h1>
      </div>

      {/* File list */}
      <div className="flex flex-col gap-2">
        {files.map((file) => {
          const folder = getFolderName(file.file_path);
          const date = formatDate(file.uploaded_at);

          return (
            <div
              key={file.file_id}
              className="flex items-center rounded-md px-6 bg-primary/10 py-4 hover:bg-primary/60 hover:text-background transition-colors cursor-pointer group"
            >
              {/* File icon */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
              >
                <FileText size={20} />
              </div>

              {/* File name & folder */}
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{folder}</p>
              </div>

              {/* File size — estimated from hash length as actual size isn't stored */}
              <div className="hidden sm:block w-24 text-right mr-6">
                <span className="text-sm text-gray-500">—</span>
              </div>

              {/* Upload date */}
              <div className="w-32 text-right shrink-0">
                <span className="text-sm text-gray-500 group-hover:text-background">
                  {date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
