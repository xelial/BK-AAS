"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation2 from "@/app/components/Navbar";

export default function CounselorSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    status: "available",
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState({
    schedules: false,
    submitting: false,
    deleting: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("week");
  const [selectedDate, setSelectedDate] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchSchedules();
  }, [filter, dateRange, selectedDate]);

  useEffect(() => {
    filterSchedules();
  }, [schedules, filter, dateRange, selectedDate]);

  const fetchSchedules = async () => {
    setLoading((prev) => ({ ...prev, schedules: true }));
    setError("");

    try {
      console.log("🔄 Fetching schedules...");

      // Pastikan endpoint benar untuk counselor
      let url = "/api/counselor/schedules";
      const params = new URLSearchParams();

      if (filter !== "all") {
        params.append("status", filter);
      }

      // Date range logic
      const today = new Date();
      let startDate = "",
        endDate = "";

      switch (dateRange) {
        case "today":
          startDate = today.toISOString().split("T")[0];
          endDate = startDate;
          break;
        case "week":
          startDate = today.toISOString().split("T")[0];
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          endDate = nextWeek.toISOString().split("T")[0];
          break;
        case "month":
          startDate = today.toISOString().split("T")[0];
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          endDate = nextMonth.toISOString().split("T")[0];
          break;
        default:
          // Untuk 'all' atau custom date, gunakan default
          if (selectedDate) {
            startDate = selectedDate;
            endDate = selectedDate;
          }
          break;
      }

      if (selectedDate) {
        // Jika ada selectedDate, gunakan itu sebagai filter utama
        params.append("startDate", selectedDate);
        params.append("endDate", selectedDate);
      } else if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("📡 Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || "Failed to fetch schedules"
        );
      }

      const data = await response.json();
      console.log("✅ Schedules data received:", data);

      setSchedules(data);
    } catch (error) {
      console.error("❌ Error fetching schedules:", error);
      setError(`Gagal memuat jadwal: ${error.message}`);
      setSchedules([]);
    } finally {
      setLoading((prev) => ({ ...prev, schedules: false }));
    }
  };

  const filterSchedules = () => {
    let filtered = [...schedules];

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter((schedule) => schedule.status === filter);
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter((schedule) => schedule.date === selectedDate);
    } else {
      const today = new Date();
      switch (dateRange) {
        case "today":
          const todayStr = today.toISOString().split("T")[0];
          filtered = filtered.filter((schedule) => schedule.date === todayStr);
          break;
        case "week":
          const weekLater = new Date(today);
          weekLater.setDate(today.getDate() + 7);
          filtered = filtered.filter((schedule) => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= today && scheduleDate <= weekLater;
          });
          break;
        case "month":
          const monthLater = new Date(today);
          monthLater.setMonth(today.getMonth() + 1);
          filtered = filtered.filter((schedule) => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= today && scheduleDate <= monthLater;
          });
          break;
        default:
          break;
      }
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      if (a.date === b.date) {
        return a.start_time.localeCompare(b.start_time);
      }
      return new Date(a.date) - new Date(b.date);
    });

    setFilteredSchedules(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSchedule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateSchedule = (data) => {
    if (!data.date || !data.start_time || !data.end_time) {
      throw new Error("Semua field harus diisi");
    }

    const scheduleDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      throw new Error("Tidak bisa membuat jadwal di tanggal yang sudah lewat");
    }

    const startTime =
      data.start_time.length === 5 ? data.start_time + ":00" : data.start_time;
    const endTime =
      data.end_time.length === 5 ? data.end_time + ":00" : data.end_time;

    if (startTime >= endTime) {
      throw new Error("Waktu mulai harus sebelum waktu selesai");
    }

    // Hitung durasi
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMinutes = (end - start) / (1000 * 60);

    if (durationMinutes < 30) {
      throw new Error("Durasi minimal 30 menit");
    }

    if (durationMinutes > 240) {
      throw new Error("Durasi maksimal 4 jam");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    setSuccess("");

    try {
      const dataToSubmit = editingSchedule || formData;

      // Validasi
      validateSchedule(dataToSubmit);

      const url = editingSchedule
        ? `/api/counselor/schedules/${editingSchedule.id}`
        : "/api/counselor/schedules";

      const method = editingSchedule ? "PUT" : "POST";

      // Format waktu dengan benar
      const formattedData = {
        ...dataToSubmit,
        start_time:
          dataToSubmit.start_time.length === 5
            ? dataToSubmit.start_time + ":00"
            : dataToSubmit.start_time,
        end_time:
          dataToSubmit.end_time.length === 5
            ? dataToSubmit.end_time + ":00"
            : dataToSubmit.end_time,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menyimpan jadwal");
      }

      setSuccess(
        editingSchedule
          ? "Jadwal berhasil diperbarui!"
          : "Jadwal berhasil ditambahkan!"
      );

      // Reset form
      if (!editingSchedule) {
        setFormData({
          date: "",
          start_time: "",
          end_time: "",
          status: "available",
        });
      }

      setEditingSchedule(null);

      // Refresh schedules
      await fetchSchedules();

      // Auto-hide success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule({
      ...schedule,
      start_time: schedule.start_time.substring(0, 5),
      end_time: schedule.end_time.substring(0, 5),
    });

    // Scroll to form
    document
      .getElementById("schedule-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      return;
    }

    setDeletingId(scheduleId);
    try {
      const response = await fetch(`/api/counselor/schedules/${scheduleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menghapus jadwal");
      }

      setSuccess("Jadwal berhasil dihapus!");
      await fetchSchedules();

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Gagal menghapus jadwal: " + error.message);
      console.error("Error deleting schedule:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setFormData({
      date: "",
      start_time: "",
      end_time: "",
      status: "available",
    });
  };

  const handleQuickAction = (schedule, action) => {
    if (action === "cancel") {
      if (confirm("Apakah Anda yakin ingin membatalkan jadwal ini?")) {
        handleEdit({ ...schedule, status: "cancelled" });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      available: {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Tersedia",
        icon: "🟢",
      },
      booked: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Terbooking",
        icon: "📅",
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Dibatalkan",
        icon: "❌",
      },
    };

    return (
      statusMap[status] || {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: status,
        icon: "❓",
      }
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMinutes = (end - start) / (1000 * 60);
    return durationMinutes;
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Kelola Jadwal
                </h1>
                <p className="text-gray-600 mt-2">
                  Atur ketersediaan jadwal konseling Anda
                </p>
              </div>
              <div className="flex space-x-3"></div>
            </div>
          </div>

          {/* Messages */}
          <div className="mb-6">
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div
                id="schedule-form"
                className="bg-white rounded-xl shadow-lg p-6 sticky top-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={editingSchedule?.date || formData.date}
                      onChange={
                        editingSchedule
                          ? handleEditInputChange
                          : handleInputChange
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waktu Mulai *
                      </label>
                      <input
                        type="time"
                        name="start_time"
                        required
                        value={
                          editingSchedule?.start_time || formData.start_time
                        }
                        onChange={
                          editingSchedule
                            ? handleEditInputChange
                            : handleInputChange
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waktu Selesai *
                      </label>
                      <input
                        type="time"
                        name="end_time"
                        required
                        value={editingSchedule?.end_time || formData.end_time}
                        onChange={
                          editingSchedule
                            ? handleEditInputChange
                            : handleInputChange
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {formData.start_time &&
                    formData.end_time &&
                    !editingSchedule && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Durasi:{" "}
                          {calculateDuration(
                            formData.start_time + ":00",
                            formData.end_time + ":00"
                          )}{" "}
                          menit
                        </p>
                      </div>
                    )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editingSchedule?.status || formData.status}
                      onChange={
                        editingSchedule
                          ? handleEditInputChange
                          : handleInputChange
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="available">Tersedia</option>
                      <option value="booked">Terbooking</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-medium mb-2">Panduan:</p>
                    <ul className="space-y-1">
                      <li>• Durasi minimal: 30 menit</li>
                      <li>• Durasi maksimal: 4 jam</li>
                      <li>• Waktu mulai harus sebelum waktu selesai</li>
                      <li>
                        • Tidak bisa membuat jadwal di tanggal yang sudah lewat
                      </li>
                      <li>• Pastikan tidak ada jadwal yang bentrok</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    {editingSchedule && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Batal Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading.submitting}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading.submitting ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Menyimpan...
                        </span>
                      ) : editingSchedule ? (
                        "Update Jadwal"
                      ) : (
                        "Simpan Jadwal"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Stats Summary */}
              <div className="mt-6 bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Statistik
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Jadwal:</span>
                    <span className="font-bold">{schedules.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tersedia:</span>
                    <span className="font-bold text-green-600">
                      {schedules.filter((s) => s.status === "available").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Terbooking:</span>
                    <span className="font-bold text-blue-600">
                      {schedules.filter((s) => s.status === "booked").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dibatalkan:</span>
                    <span className="font-bold text-red-600">
                      {schedules.filter((s) => s.status === "cancelled").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule List Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                      Daftar Jadwal
                    </h2>
                    <div className="text-sm text-gray-500">
                      Total:{" "}
                      <span className="font-semibold">
                        {filteredSchedules.length} jadwal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        {["all", "available", "booked", "cancelled"].map(
                          (status) => {
                            const badge = getStatusBadge(status);
                            return (
                              <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                                  filter === status
                                    ? `${badge.color} border`
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                <span className="mr-2">{badge.icon}</span>
                                {status === "all" ? "Semua" : badge.text}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setDateRange("custom");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Pilih tanggal"
                      />
                      <select
                        value={dateRange}
                        onChange={(e) => {
                          setDateRange(e.target.value);
                          setSelectedDate("");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="today">Hari Ini</option>
                        <option value="week">7 Hari ke Depan</option>
                        <option value="month">30 Hari ke Depan</option>
                        <option value="all">Semua Jadwal</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Schedule List */}
                <div className="divide-y divide-gray-200">
                  {loading.schedules ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">Memuat jadwal...</p>
                    </div>
                  ) : filteredSchedules.length === 0 ? (
                    <div className="text-center py-12">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Belum ada jadwal
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Tambahkan jadwal baru untuk memulai
                      </p>
                      <button
                        onClick={() => {
                          const element =
                            document.getElementById("schedule-form");
                          element?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        + Tambah Jadwal Baru
                      </button>
                    </div>
                  ) : (
                    filteredSchedules.map((schedule) => {
                      const badge = getStatusBadge(schedule.status);
                      const duration = calculateDuration(
                        schedule.start_time,
                        schedule.end_time
                      );

                      return (
                        <div
                          key={schedule.id}
                          className="p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {formatDate(schedule.date)}
                                </h3>
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${badge.color}`}
                                >
                                  {badge.icon} {badge.text}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600 space-x-4">
                                <div className="flex items-center">
                                  <svg
                                    className="w-5 h-5 mr-2 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>
                                    {formatTime(schedule.start_time)} -{" "}
                                    {formatTime(schedule.end_time)}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <svg
                                    className="w-5 h-5 mr-2 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>{duration} menit</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              {schedule.status === "available" && (
                                <button
                                  onClick={() => handleEdit(schedule)}
                                  className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                              {schedule.status !== "booked" && (
                                <button
                                  onClick={() => handleDelete(schedule.id)}
                                  disabled={deletingId === schedule.id}
                                  className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === schedule.id
                                    ? "Menghapus..."
                                    : "Hapus"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Booking Info jika ada */}
                          {schedule.status === "booked" &&
                            schedule.student_name && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center mb-3">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 border border-blue-200">
                                    <svg
                                      className="w-5 h-5 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {schedule.student_name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {schedule.student_email}
                                    </p>
                                  </div>
                                </div>

                                {schedule.topic && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        Topik:
                                      </span>{" "}
                                      {schedule.topic}
                                    </p>
                                  </div>
                                )}

                                {schedule.notes && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        Catatan:
                                      </span>{" "}
                                      {schedule.notes}
                                    </p>
                                  </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-blue-200">
                                  <Link
                                    href={`/counselor/bookings/${schedule.booking_id}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    Lihat Detail Booking →
                                  </Link>
                                </div>
                              </div>
                            )}

                          {/* Quick Actions */}
                          {schedule.status === "available" && (
                            <div className="mt-4 flex justify-end space-x-3">
                              <button
                                onClick={() =>
                                  handleQuickAction(schedule, "cancel")
                                }
                                className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-300 rounded-lg hover:border-red-300"
                              >
                                Batalkan Jadwal
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Summary */}
                {filteredSchedules.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center flex-wrap gap-3">
                        <span className="font-medium">Rangkuman:</span>
                        <span className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                          Tersedia:{" "}
                          {
                            filteredSchedules.filter(
                              (s) => s.status === "available"
                            ).length
                          }
                        </span>
                        <span className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                          Terbooking:{" "}
                          {
                            filteredSchedules.filter(
                              (s) => s.status === "booked"
                            ).length
                          }
                        </span>
                        <span className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                          Dibatalkan:{" "}
                          {
                            filteredSchedules.filter(
                              (s) => s.status === "cancelled"
                            ).length
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const element =
                            document.getElementById("schedule-form");
                          element?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        + Tambah Jadwal Baru
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Actions */}
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aksi Cepat
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={fetchSchedules}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFormData((prev) => ({
                        ...prev,
                        date: tomorrow.toISOString().split("T")[0],
                      }));
                      document
                        .getElementById("schedule-form")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    + Jadwal Besok
                  </button>
                  <button
                    onClick={() => router.push("/counselor/bookings")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Lihat Semua Bookings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
