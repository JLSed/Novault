import { login } from "./actions";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-black mb-4">Login</h1>
      <form className="flex flex-col gap-4 p-8 w-lg">
        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="border p-2 rounded text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="border p-2 rounded text-black"
          />
        </div>
        <button
          formAction={login}
          className="bg-primary text-white p-2 rounded  "
        >
          Log in
        </button>
        <div className="text-center mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
