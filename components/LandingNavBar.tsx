import Link from "next/link";
export const LandingNavBar = () => {
  return (
    <div className="flex justify-end gap-4 px-8 py-4 w-full">
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
  );
};
