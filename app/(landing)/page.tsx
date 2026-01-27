import { LandingNavBar } from "@/components/LandingNavBar";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full">
      <LandingNavBar />
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-2xl font-black mb-4">noVault</h1>
      </div>
    </div>
  );
}
