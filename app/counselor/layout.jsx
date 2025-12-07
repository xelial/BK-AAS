"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Copyright3 from "../components/Footer";
import Navigation2 from "../components/Navbar";

export default function CounselorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(0);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav>
        <Navigation2 />
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <Copyright3 />
    </div>
  );
}
