"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateBookingPage() {
  const [formData, setFormData] = useState({
    counselor_id: "",
    schedule_id: "",
    date: "",
    time: "",
    notes: "",
    topic: "",
  });
  const [counselors, setCounselors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [loading, setLoading] = useState({
    counselors: false,
    schedules: false,
    submitting: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Step dalam booking process
  const [step, setStep] = useState(1);

  // Load counselors
  useEffect(() => {
    fetchCounselors();
  }, []);

  // Load schedules when counselor is selected
  useEffect(() => {
    if (formData.counselor_id) {
      fetchSchedules(formData.counselor_id);
    }
  }, [formData.counselor_id]);

  const fetchCounselors = async () => {
    setLoading((prev) => ({ ...prev, counselors: true }));
    setError("");

    try {
      console.log("🔄 Fetching counselors...");

      const response = await fetch("/api/counselor", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // Penting untuk session
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response OK:", response.ok);

      // Baca response sebagai text terlebih dahulu
      const responseText = await response.text();
      console.log("📄 Raw response:", responseText.substring(0, 200) + "...");

      let data;
      try {
        // Parse JSON dari text
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON:", parseError);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}`
        );
      }

      if (!response.ok) {
        // Gunakan data dari parsed JSON jika ada error
        throw new Error(
          data?.error || data?.message || `HTTP ${response.status}`
        );
      }

      console.log("✅ Counselors data parsed:", data);
      console.log("📊 Data type:", typeof data);
      console.log("📊 Is array?", Array.isArray(data));

      // Pastikan data adalah array
      if (!Array.isArray(data)) {
        console.warn("⚠️ Data is not an array:", data);

        // Coba ekstrak array dari berbagai format
        let extractedArray = [];

        if (data && typeof data === "object") {
          // Coba properti umum yang mungkin berisi array
          if (Array.isArray(data.counselors)) extractedArray = data.counselors;
          else if (Array.isArray(data.data)) extractedArray = data.data;
          else if (Array.isArray(data.results)) extractedArray = data.results;
          else if (Array.isArray(data.items)) extractedArray = data.items;
          else if (data.counselors && typeof data.counselors === "object") {
            // Jika counselors adalah objek, konversi ke array
            extractedArray = Object.values(data.counselors);
          } else {
            // Jika hanya objek tunggal, masukkan ke array
            extractedArray = [data];
          }
        }

        console.log("📦 Extracted array:", extractedArray);
        setCounselors(extractedArray);
      } else {
        setCounselors(data);
      }
    } catch (error) {
      console.error("❌ Error fetching counselors:", error);
      console.error("Error stack:", error.stack);

      // Set error message yang lebih spesifik
      const errorMessage = error.message.includes("JSON")
        ? "Format data counselor tidak valid"
        : error.message;

      setError(`Gagal memuat data counselor: ${errorMessage}`);
      setCounselors([]); // Pastikan tetap array kosong
    } finally {
      setLoading((prev) => ({ ...prev, counselors: false }));
    }
  };

  const fetchSchedules = async (counselorId) => {
    setLoading((prev) => ({ ...prev, schedules: true }));
    setError("");

    try {
      if (!counselorId) {
        throw new Error("Counselor ID tidak valid");
      }

      // Get today's date
      const today = new Date().toISOString().split("T")[0];
      const url = `/api/counselor/${counselorId}/schedules?startDate=${today}`;

      console.log("🔄 Fetching schedules from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response OK:", response.ok);

      // Baca sebagai text terlebih dahulu
      const responseText = await response.text();
      console.log("📄 Raw schedule response:", responseText.substring(0, 200));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse schedule JSON:", parseError);
        throw new Error("Format data jadwal tidak valid");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || `HTTP ${response.status}`
        );
      }

      console.log("✅ Schedules data:", data);

      // Pastikan data adalah array
      const schedulesArray = Array.isArray(data) ? data : [];

      setSchedules(schedulesArray);
      setFilteredSchedules(
        schedulesArray.filter((s) => s.status === "available")
      );

      // Set selected counselor info
      const counselor = counselors.find((c) => c.id == counselorId);
      setSelectedCounselor(counselor || { name: "Counselor", id: counselorId });
    } catch (error) {
      console.error("❌ Error fetching schedules:", error);
      setError(`Gagal memuat jadwal tersedia: ${error.message}`);
      setSchedules([]);
      setFilteredSchedules([]);
    } finally {
      setLoading((prev) => ({ ...prev, schedules: false }));
    }
  };

  const handleCounselorSelect = (counselorId) => {
    setFormData((prev) => ({
      ...prev,
      counselor_id: counselorId,
      schedule_id: "",
      date: "",
      time: "",
    }));
    setStep(2);
  };

  const handleScheduleSelect = (schedule) => {
    setFormData((prev) => ({
      ...prev,
      schedule_id: schedule.id,
      date: schedule.date,
      time: `${schedule.start_time.substring(
        0,
        5
      )} - ${schedule.end_time.substring(0, 5)}`,
    }));
    setStep(3);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/counselor/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedule_id: formData.schedule_id,
          notes: formData.notes,
          topic: formData.topic,
        }),
        credentials: "include",
      });

      console.log("📡 Booking response status:", response.status);

      // Baca sebagai text terlebih dahulu
      const responseText = await response.text();
      console.log("📄 Booking response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse booking response:", parseError);
        throw new Error("Format response booking tidak valid");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Gagal membuat booking"
        );
      }

      setSuccess(
        "Booking berhasil dibuat! Menunggu konfirmasi dari counselor."
      );

      // Reset form after success
      setTimeout(() => {
        router.push("/student/booking"); // atau "/student/bookings" sesuai routing Anda
      }, 2000);
    } catch (error) {
      console.error("❌ Booking error:", error);
      setError(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
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

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setFormData((prev) => ({
          ...prev,
          schedule_id: "",
          date: "",
          time: "",
        }));
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Buat Janji Konseling
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pilih counselor, tentukan waktu yang sesuai, dan jelaskan topik yang
            ingin didiskusikan
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= stepNumber
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-24 h-1 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 max-w-md mx-auto text-sm text-gray-600">
            <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>
              Pilih Counselor
            </span>
            <span className={step >= 2 ? "text-blue-600 font-medium" : ""}>
              Pilih Jadwal
            </span>
            <span className={step >= 3 ? "text-blue-600 font-medium" : ""}>
              Konfirmasi
            </span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto">
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

        {success && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Counselor */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Pilih Counselor
            </h2>

            {loading.counselors ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {counselors.map((counselor) => (
                  <div
                    key={counselor.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300"
                    onClick={() => handleCounselorSelect(counselor.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          {counselor.profile_picture ? (
                            <img
                              src={counselor.profile_picture}
                              alt={counselor.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-blue-600">
                              {counselor.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {counselor.name}
                          </h3>
                          <p className="text-sm text-gray-500">BK Counselor</p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {counselor.bio ||
                          "Spesialis konseling siswa dengan pengalaman bertahun-tahun"}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            {counselor.available_slots || 0} slot tersedia
                          </span>
                        </div>
                        <button className="text-blue-600 font-medium hover:text-blue-800">
                          Pilih →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Schedule */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Pilih Waktu Konseling
            </h2>

            {selectedCounselor && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    {selectedCounselor.profile_picture ? (
                      <img
                        src={selectedCounselor.profile_picture}
                        alt={selectedCounselor.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-blue-600">
                        {selectedCounselor.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedCounselor.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Counselor yang dipilih
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading.schedules ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
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
                  Tidak ada jadwal tersedia
                </h3>
                <p className="text-gray-500">
                  Silakan pilih counselor lain atau coba lagi nanti
                </p>
              </div>
            ) : (
              <div>
                {/* Group schedules by date */}
                {Array.from(new Set(filteredSchedules.map((s) => s.date))).map(
                  (date) => (
                    <div key={date} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {formatDate(date)}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSchedules
                          .filter((s) => s.date === date)
                          .map((schedule) => (
                            <button
                              key={schedule.id}
                              onClick={() => handleScheduleSelect(schedule)}
                              className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                                formData.schedule_id === schedule.id
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              <div className="font-medium text-gray-900">
                                {schedule.start_time.substring(0, 5)} -{" "}
                                {schedule.end_time.substring(0, 5)}
                              </div>
                              <div className="mt-2 flex items-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Tersedia
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Konfirmasi Booking
            </h2>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Booking Summary */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ringkasan Booking
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      {selectedCounselor?.profile_picture ? (
                        <img
                          src={selectedCounselor.profile_picture}
                          alt={selectedCounselor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-blue-600">
                          {selectedCounselor?.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedCounselor?.name}
                      </div>
                      <div className="text-sm text-gray-500">Counselor</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-sm text-gray-500">Tanggal</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(formData.date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Waktu</div>
                      <div className="font-medium text-gray-900">
                        {formData.time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="topic"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Topik Konseling *
                    </label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      required
                      value={formData.topic}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contoh: Masalah akademik, kesehatan mental, karir, dll."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jelaskan secara singkat apa yang ingin kamu diskusikan dengan counselor..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Informasi ini akan membantu counselor mempersiapkan sesi
                      konseling.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Perhatian:</strong> Booking akan menunggu
                          konfirmasi dari counselor. Kamu akan mendapat
                          notifikasi ketika booking dikonfirmasi atau
                          dibatalkan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading.submitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading.submitting ? (
                      <span className="flex items-center">
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
                        Memproses...
                      </span>
                    ) : (
                      "Buat Janji Konseling"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step Navigation */}
        {step < 3 && (
          <div className="mt-8 text-center">
            <button
              onClick={goBack}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Kembali ke {step === 2 ? "Pilih Counselor" : "Beranda"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
