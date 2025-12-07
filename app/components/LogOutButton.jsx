"use client";

import { signOut } from "next-auth/react";

export default function LogOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };
  return (
    <button
      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
      onClick={handleSignOut}
    >
      Log Out
    </button>
  );
}
