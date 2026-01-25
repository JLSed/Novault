import { signup } from "./actions";
import Link from "next/link";

export default async function SignupPage(props: {
  searchParams: Promise<{ message: string; error: string }>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-black mb-4">Sign Up</h1>
      {searchParams.message && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded relative mb-4 w-128">
          {searchParams.message}
        </div>
      )}
      {searchParams.error && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded relative mb-4">
          {searchParams.error}
        </div>
      )}
      <form className="flex flex-col gap-4  p-8 w-128">
        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="border border-foreground p-2 rounded text-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="border border-foreground p-2 rounded text-foreground"
          />
        </div>
        <button
          formAction={signup}
          className="bg-primary text-background p-2 rounded cursor-pointer"
        >
          Sign up
        </button>
        <div className="text-center mt-2">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
