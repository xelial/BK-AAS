"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation2 from "@/app/components/Navbar";

export default function CounselorDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalStudents: 0,
    upcomingSessions: 0,
    availableSlots: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch stats
      const statsRes = await fetch("/api/counselor/dashboard/stats", {
        credentials: "include",
      });
      const statsData = await statsRes.json();
      if (!statsRes.ok)
        throw new Error(statsData.error || "Failed to fetch stats");
      setStats(statsData);

      // Fetch recent bookings
      const bookingsRes = await fetch("/api/counselor/bookings?limit=5", {
        credentials: "include",
      });
      const bookingsData = await bookingsRes.json();
      if (!bookingsRes.ok)
        throw new Error(bookingsData.error || "Failed to fetch bookings");
      setRecentBookings(bookingsData);

      // Fetch upcoming schedules
      const schedulesRes = await fetch(
        "/api/counselor/schedules?limit=5&status=available",
        {
          credentials: "include",
        }
      );
      const schedulesData = await schedulesRes.json();
      if (!schedulesRes.ok)
        throw new Error(schedulesData.error || "Failed to fetch schedules");
      setUpcomingSchedules(schedulesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Menunggu",
      },
      confirmed: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Dikonfirmasi",
      },
      completed: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Selesai",
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Dibatalkan",
      },
    };
    const statusConfig = config[status] || config.pending;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
      >
        {statusConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Counselor
          </h1>
          <p className="mt-2 text-gray-600">
            Selamat datang! Lihat ringkasan aktivitas konseling Anda.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalBookings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Menunggu Konfirmasi
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingBookings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Sesi Mendatang
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.upcomingSessions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Booking Terbaru
                </h2>
                <Link
                  href="/counselor/bookings"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Lihat Semua →
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/counselor/bookings/${booking.id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.student_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {booking.topic}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(booking.start_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.booking_status)}
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Tidak ada booking terbaru
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Schedules */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Jadwal Tersedia
                </h2>
                <Link
                  href="/counselor/schedules"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Kelola Jadwal →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(schedule.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(schedule.start_time)} -{" "}
                        {formatTime(schedule.end_time)}
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Tersedia
                    </span>
                  </div>
                ))}
                {upcomingSchedules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>Tidak ada jadwal tersedia</p>
                    <Link
                      href="/counselor/schedules/"
                      className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                    >
                      Buat Jadwal Baru
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Buat Jadwal Baru</h3>
            <p className="text-blue-100 mb-4">
              Tambahkan slot konseling baru untuk siswa
            </p>
            <Link
              href="/counselor/schedules/create"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Tambah Jadwal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
