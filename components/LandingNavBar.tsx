import Link from "next/link";

export const LandingNavBar = () => {
  return (
    <div className="flex justify-between items-center px-8 py-4 w-full">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8">
          <div
            className="w-full h-full bg-primary"
            style={{
              maskImage: "url(/logo.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url(/logo.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        </div>
      </Link>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-primary text-background p-2 rounded text-center"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="border border-foreground p-2 rounded text-center"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
};
