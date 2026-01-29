import { signOut } from "@/app/home/actions";

interface HomeNavBarProps {
  userEmail: string;
  userRole: string;
  hasMasterKey?: boolean;
}

export const HomeNavBar = ({
  userEmail,
  userRole,
  hasMasterKey,
}: HomeNavBarProps) => {
  return (
    <div className="flex justify-end gap-4 px-4 py-4 w-full">
      <div className="flex-1">
        {hasMasterKey ? (
          <span className="text-sm text-green-600">
            ✓ Master key configured
          </span>
        ) : (
          <span className="text-sm text-orange-500">⚠ Master key not set</span>
        )}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-foreground">{userEmail}</span>
        <span className="text-xs text-gray-500 capitalize">
          Role: {userRole}
        </span>
      </div>
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
