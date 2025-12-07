'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CounselorCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [view, setView] = useState('month') // month, week, day
  const router = useRouter()

  useEffect(() => {
    fetchSchedules()
  }, [currentDate, view])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      // Calculate date range based on view
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)
      
      if (view === 'month') {
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
      } else if (view === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay())
        endDate.setDate(startDate.getDate() + 6)
      }
      // For day view, startDate and endDate are the same

      const response = await fetch(
        `/api/counselor/schedules?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch schedules')
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    setCurrentDate(newDate)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'booked': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Render calendar based on view
  const renderCalendar = () => {
    if (view === 'month') {
      return renderMonthView()
    } else if (view === 'week') {
      return renderWeekView()
    } else {
      return renderDayView()
    }
  }

  const renderMonthView = () => {
    // Implementation for month view calendar
    return (
      <div className="text-center">
        <p>Month View - Implement calendar grid here</p>
      </div>
    )
  }

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kalender Jadwal</h1>
              <p className="text-gray-600 mt-2">Lihat jadwal Anda dalam tampilan kalender</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/counselor/schedules"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Kembali ke List
              </Link>
              <Link
                href="/counselor/schedules"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Tambah Jadwal
              </Link>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('id-ID', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              
              <button
                onClick={() => navigateDate(1)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hari Ini
              </button>
            </div>

            <div className="flex space-x-2">
              {['month', 'week', 'day'].map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                    view === viewType
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {viewType === 'month' ? 'Bulan' : viewType === 'week' ? 'Minggu' : 'Hari'}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Simplified calendar view - show schedules list instead */}
              <div className="divide-y divide-gray-200">
                {schedules.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Tidak ada jadwal pada periode ini</p>
                  </div>
                ) : (
                  schedules.map((schedule) => (
                    <div key={schedule.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(schedule.status)}`}></div>
                            <span className="font-medium">
                              {new Date(schedule.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          </div>
                          <div className="mt-1 ml-6 text-gray-600">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            {schedule.status === 'booked' && schedule.student_name && (
                              <span className="ml-4">
                                • Dengan: {schedule.student_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/counselor/schedules`)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legenda</h3>
          <div className="flex space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Tersedia</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Terbooking</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600">Dibatalkan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}