"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/api/auth/[...nextauth]/route";
import LogOutButton from "./LogOutButton";

const Navigation2 = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setUser(data?.user || null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Routes berdasarkan role user
  const getRoutes = () => {
    const commonRoutes = [
      { name: "Home", href: "/", isActive: pathname === "/" },
    ];

    if (!user) return commonRoutes;

    switch (user.role) {
      case "student":
        return [
          ...commonRoutes,
          {
            name: "Booking",
            href: "/student/booking/create",
            isActive: pathname.includes("/student/booking"),
          },
          {
            name: "Riwayat",
            href: "/student/bookings",
            isActive:
              pathname.includes("/student/bookings") &&
              !pathname.includes("/create"),
          },
        ];
      case "counselor":
        return [
          ...commonRoutes,
          {
            name: "Dashboard",
            href: "/counselor/dashboard",
            isActive: pathname.includes("/counselor/dashboard"),
          },
          {
            name: "Jadwal",
            href: "/counselor/schedules",
            isActive: pathname.includes("/counselor/schedules"),
          },
          {
            name: "Booking",
            href: "/counselor/bookings",
            isActive: pathname.includes("/counselor/bookings"),
          },
        ];
      case "admin":
        return [
          ...commonRoutes,
          {
            name: "Dashboard",
            href: "/admin",
            isActive:
              pathname.includes("/admin") && !pathname.includes("/users"),
          },
          {
            name: "Manajemen User",
            href: "/admin/users",
            isActive: pathname.includes("/admin/users"),
          },
        ];
      default:
        return commonRoutes;
    }
  };

  const routes = getRoutes();

  const NavMenu = () => (
    <>
      {routes.map((route, i) => (
        <li key={i}>
          <Link
            href={route.href}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              route.isActive
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {route.name}
          </Link>
        </li>
      ))}
    </>
  );

  const AuthNavMenu = () => {
    if (loading) {
      return (
        <li>
          <div className="animate-pulse h-9 w-24 bg-gray-200 rounded-lg"></div>
        </li>
      );
    }

    if (user) {
      return (
        <li className="relative group">
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user.name?.charAt(0) || "U"}
              </span>
            </div>
            <span className="hidden md:inline font-medium text-gray-700">
              {user.name}
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 hidden group-hover:block">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                {user.role}
              </span>
            </div>
            <Link
              href="/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            {user.role === "student" && (
              <Link
                href="/student/bookings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Booking Saya
              </Link>
            )}
            <LogOutButton />
          </div>
        </li>
      );
    }

    return (
      <li>
        <Link
          href="/auth/login"
          className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-2 px-4 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Sign In
        </Link>
      </li>
    );
  };

  return (
    <div className="ezy__nav2 light py-4 bg-white shadow-sm sticky top-0 z-40">
      <nav>
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="font-bold text-2xl text-blue-600">
              BK<span className="text-gray-900">Counselor</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="block lg:hidden cursor-pointer h-10 w-10 z-20"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6 mx-auto">
                <span
                  className={`absolute h-0.5 w-6 bg-gray-700 transition-all duration-300 ${
                    mobileMenuOpen ? "rotate-45 top-3" : "top-1"
                  }`}
                ></span>
                <span
                  className={`absolute h-0.5 w-6 bg-gray-700 top-3 transition-all duration-300 ${
                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`absolute h-0.5 w-6 bg-gray-700 transition-all duration-300 ${
                    mobileMenuOpen ? "-rotate-45 top-3" : "top-5"
                  }`}
                ></span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex lg:flex-row items-center space-x-2">
              <NavMenu />
              <AuthNavMenu />
            </ul>

            {/* Mobile Navigation */}
            <div
              className={`lg:hidden fixed inset-0 z-10 transition-all duration-300 ${
                mobileMenuOpen
                  ? "bg-black bg-opacity-50 visible"
                  : "bg-transparent invisible"
              }`}
            >
              <div
                className={`absolute top-0 right-0 h-full w-64 bg-white shadow-xl transition-transform duration-300 ${
                  mobileMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-bold text-xl text-blue-600">
                      Menu
                    </span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      aria-label="Close menu"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {routes.map((route, i) => (
                      <li key={i}>
                        <Link
                          href={route.href}
                          className={`block px-4 py-3 rounded-lg transition-colors ${
                            route.isActive
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {route.name}
                        </Link>
                      </li>
                    ))}

                    <div className="pt-4 border-t border-gray-200 mt-4">
                      {user ? (
                        <>
                          <div className="px-4 py-3 mb-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {user.name?.charAt(0) || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {user.role}
                                </p>
                              </div>
                            </div>
                          </div>

                          <li>
                            <Link
                              href="/profile"
                              className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Profile
                            </Link>
                          </li>
                          {user.role === "student" && (
                            <li>
                              <Link
                                href="/student/bookings"
                                className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                Booking Saya
                              </Link>
                            </li>
                          )}
                        </>
                      ) : (
                        <li>
                          <Link
                            href="/auth/login"
                            className="block px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                        </li>
                      )}
                    </div>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navigation2;
