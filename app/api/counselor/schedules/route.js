import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  console.log("📞 API Counselor Schedules GET called");

  try {
    // Cek session
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    console.log("👤 Session user:", session.user);

    // Pastikan user adalah counselor
    if (session.user.role !== "counselor") {
      return NextResponse.json(
        { error: "Unauthorized - Only counselors can access this endpoint" },
        { status: 403 }
      );
    }

    // Get counselor ID dari database
    const [counselor] = await db.execute(
      "SELECT id FROM counselors WHERE user_id = ?",
      [session.user.id]
    );

    if (counselor.length === 0) {
      return NextResponse.json(
        { error: "Counselor profile not found" },
        { status: 404 }
      );
    }

    const counselorId = counselor[0].id;
    console.log("✅ Counselor ID:", counselorId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("🔍 Query params:", { status, startDate, endDate });

    // Query untuk mendapatkan jadwal counselor
    let query = `
      SELECT 
        s.*,
        b.id as booking_id,
        b.status as booking_status,
        b.topic,
        b.notes,
        u.name as student_name,
        u.email as student_email,
        TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) as duration
      FROM schedules s
      LEFT JOIN bookings b ON s.id = b.schedule_id AND b.status != 'cancelled'
      LEFT JOIN users u ON b.student_id = u.id
      WHERE s.counselor_id = ?
    `;

    const params = [counselorId];

    if (status && status !== "all") {
      query += " AND s.status = ?";
      params.push(status);
    }

    if (startDate && endDate) {
      query += " AND s.date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    } else if (startDate) {
      query += " AND s.date >= ?";
      params.push(startDate);
    }

    query += " ORDER BY s.date, s.start_time";

    console.log("📝 SQL Query:", query);
    console.log("📝 SQL Params:", params);

    const [schedules] = await db.execute(query, params);

    console.log(`✅ Found ${schedules.length} schedules`);

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("❌ Error in /api/counselor/schedules:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch schedules",
        details: error.message,
        sqlError: error.sqlMessage,
      },
      { status: 500 }
    );
  }
}

// POST: Create new schedule
export async function POST(request) {
  console.log("📞 API Counselor Schedules POST called");

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counselor ID
    const [counselor] = await db.execute(
      "SELECT id FROM counselors WHERE user_id = ?",
      [session.user.id]
    );

    if (counselor.length === 0) {
      return NextResponse.json(
        { error: "Counselor profile not found" },
        { status: 404 }
      );
    }

    const counselorId = counselor[0].id;
    const data = await request.json();

    console.log("📦 Schedule data received:", data);

    // Validasi input
    if (!data.date || !data.start_time || !data.end_time) {
      return NextResponse.json(
        { error: "Date, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    // Format waktu
    const startTime = data.start_time.includes(":")
      ? data.start_time
      : `${data.start_time}:00`;
    const endTime = data.end_time.includes(":")
      ? data.end_time
      : `${data.end_time}:00`;

    // Cek apakah schedule bentrok
    const [conflicting] = await db.execute(
      `SELECT id FROM schedules 
       WHERE counselor_id = ? 
         AND date = ? 
         AND (
           (start_time < ? AND end_time > ?) OR
           (start_time >= ? AND start_time < ?) OR
           (end_time > ? AND end_time <= ?)
         )
       LIMIT 1`,
      [
        counselorId,
        data.date,
        endTime,
        startTime,
        startTime,
        endTime,
        startTime,
        endTime,
      ]
    );

    if (conflicting.length > 0) {
      return NextResponse.json(
        { error: "Schedule conflicts with existing schedule" },
        { status: 400 }
      );
    }

    // Cek apakah tanggal sudah lewat
    const scheduleDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      return NextResponse.json(
        { error: "Cannot create schedule in the past" },
        { status: 400 }
      );
    }

    // Cek apakah start time sebelum end time
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Cek durasi minimal (30 menit)
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMinutes = (end - start) / (1000 * 60);

    if (durationMinutes < 30) {
      return NextResponse.json(
        { error: "Minimum duration is 30 minutes" },
        { status: 400 }
      );
    }

    // Insert schedule baru
    const [result] = await db.execute(
      "INSERT INTO schedules (counselor_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)",
      [counselorId, data.date, startTime, endTime, data.status || "available"]
    );

    // Ambil schedule yang baru dibuat
    const [newSchedule] = await db.execute(
      `SELECT s.*, TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) as duration 
       FROM schedules s WHERE id = ?`,
      [result.insertId]
    );

    console.log("✅ Schedule created:", newSchedule[0]);

    return NextResponse.json(
      {
        message: "Schedule created successfully",
        schedule: newSchedule[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}