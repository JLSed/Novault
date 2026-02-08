"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { FileMetadata } from "@/app/home/storage/actions";
import FileDecryptionModal from "@/components/FileDecryptionModal";

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
 * FileViewer displays a list of user files in a clean table-like layout.
 * Shows file name, folder, size, and upload date.
 */
export default function FileViewer({ files }: FileViewerProps) {
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);

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
          const date = formatDate(file.uploaded_at);

          return (
            <div
              key={file.file_id}
              onClick={() => setSelectedFile(file)}
              className="flex items-center rounded-md px-4 bg-primary/5 py-4 hover:bg-primary/10 text-foreground transition-colors cursor-pointer group"
            >
              {/* File icon */}
              <div
                className={`w-10 h-10 flex items-center justify-center shrink-0`}
              >
                <FileText size={20} />
              </div>

              {/* File name & folder */}
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                {/* <p className="text-xs mt-0.5">{folder}</p> */}
              </div>

              {/* File size — wala pa */}
              <div className="hidden sm:block w-24 text-right mr-6">
                <span className="text-sm text-gray-500">—</span>
              </div>

              {/* Upload date */}
              <div className="w-32 text-right shrink-0">
                <span className="text-sm text-gray-500">{date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decryption modal */}
      {selectedFile && (
        <FileDecryptionModal
          file={selectedFile}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
