import FileViewer from "@/components/FileViewer";
import { getUserFiles } from "./actions";

export default async function StoragePage() {
  const { files, error } = await getUserFiles();

  if (error) {
    console.error("[StoragePage] Failed to load files:", error);
  }

  return (
    <div className="p-4 space-y-6">
      <FileViewer files={files} />
    </div>
  );
}
