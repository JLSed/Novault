import { signOut } from "@/app/home/actions";

export const HomeNavBar = () => {
  return (
    <div className="flex justify-end gap-4 px-8 py-4 w-full">
      <form action={signOut}>
        <button
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
};
