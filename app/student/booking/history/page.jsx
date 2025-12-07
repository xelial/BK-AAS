"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const router = useRouter();

  const filters = [
    { value: "all", label: "Semua", color: "gray" },
    { value: "pending", label: "Menunggu", color: "yellow" },
    { value: "confirmed", label: "Dikonfirmasi", color: "blue" },
    { value: "completed", label: "Selesai", color: "green" },
    { value: "cancelled", label: "Dibatalkan", color: "red" },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter((booking) => booking.booking_status === activeFilter)
      );
    }
  }, [bookings, activeFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/bookings?limit=50", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      console.log("📡 Bookings response status:", response.status);

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse bookings JSON:", parseError);
        throw new Error("Format data bookings tidak valid");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || `HTTP ${response.status}`
        );
      }

      console.log("✅ Bookings data:", data);
      setBookings(data);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      setError(`Gagal memuat history bookings: ${error.message}`);
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
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Menunggu",
        icon: (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
      confirmed: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Dikonfirmasi",
        icon: (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
      completed: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Selesai",
        icon: (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Dibatalkan",
        icon: (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getStatusCount = (status) => {
    if (status === "all") return bookings.length;
    return bookings.filter((b) => b.booking_status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                History Konseling
              </h1>
              <p className="mt-2 text-gray-600">
                Lihat dan kelola semua janji konseling Anda
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/student/booking/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Buat Janji Baru
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                activeFilter === filter.value
                  ? `border-${filter.color}-500 bg-${filter.color}-50 ring-2 ring-${filter.color}-200`
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    activeFilter === filter.value
                      ? `text-${filter.color}-600`
                      : "text-gray-900"
                  }`}
                >
                  {getStatusCount(filter.value)}
                </div>
                <div
                  className={`text-sm ${
                    activeFilter === filter.value
                      ? `text-${filter.color}-600`
                      : "text-gray-500"
                  }`}
                >
                  {filter.label}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada booking
            </h3>
            <p className="text-gray-500 mb-6">
              {activeFilter === "all"
                ? "Anda belum membuat booking konseling"
                : `Tidak ada booking dengan status "${filters.find(f => f.value === activeFilter)?.label.toLowerCase()}"`}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Lihat Semua Booking
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Counselor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Tanggal & Waktu
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Topik
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Dibuat
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.booking_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {booking.counselor_photo ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={booking.counselor_photo}
                                alt={booking.counselor_name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold">
                                  {booking.counselor_name?.charAt(0) || "C"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.counselor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.counselor_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(booking.start_time)} -{" "}
                          {formatTime(booking.end_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {booking.topic}
                        </div>
                        {booking.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {booking.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.booking_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() =>
                            router.push(
                              `/student/booking/${booking.booking_id}`
                            )
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detail
                        </button>
                        {booking.booking_status === "pending" && (
                          <button
                            onClick={() => handleCancelBooking(booking.booking_id)}
                            className="ml-4 text-red-600 hover:text-red-900"
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 text-sm text-gray-500">
          Menampilkan {filteredBookings.length} dari {bookings.length} booking
        </div>
      </div>
    </div>
  );
}