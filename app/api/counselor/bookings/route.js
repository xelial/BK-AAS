import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Untuk counselor melihat daftar booking mereka
export async function GET(request) {
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
        { error: "Counselor not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || 5;
    const status = searchParams.get("status");
    const counselorId = counselor[0].id;

    let query = `
      SELECT 
        b.id,
        b.notes,
        b.status as booking_status,
        b.created_at,
        b.topic,
        s.date,
        s.start_time,
        s.end_time,
        s.status as schedule_status,
        u.name as student_name,
        u.email as student_email
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN users u ON b.student_id = u.id
      WHERE s.counselor_id = ?
    `;

    const params = [counselorId];

    if (status) {
      query += " AND b.status = ?";
      params.push(status);
    }

    query += " ORDER BY s.date DESC, s.start_time DESC LIMIT ?";
    params.push(parseInt(limit));

    const [bookings] = await db.execute(query, params);

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching counselor bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST: Untuk student membuat booking
export async function POST(request) {
  console.log("📞 API Create Booking POST called");

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

    // Pastikan user adalah student
    if (session.user.role !== "student") {
      console.log("❌ User is not a student");
      return NextResponse.json(
        { error: "Only students can create bookings" },
        { status: 403 }
      );
    }

    const data = await request.json();
    console.log("📦 Booking data received:", data);

    const { schedule_id, notes, topic } = data;

    // Validasi input
    if (!schedule_id || !topic) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Schedule ID and topic are required" },
        { status: 400 }
      );
    }

    // ✅ PERBAIKAN 1: Tidak perlu mencari di students table karena booking.student_id langsung ke users.id
    // Langsung gunakan session.user.id sebagai student_id
    const student_id = session.user.id;
    console.log("✅ Using student_id (from session):", student_id);

    // Cek apakah schedule tersedia
    const [schedule] = await db.execute(
      `SELECT s.*, c.user_id as counselor_user_id 
       FROM schedules s 
       JOIN counselors c ON s.counselor_id = c.id 
       WHERE s.id = ?`,
      [schedule_id]
    );

    if (schedule.length === 0) {
      console.log("❌ Schedule not found");
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    console.log("✅ Schedule found:", schedule[0]);

    // Cek status schedule
    if (schedule[0].status !== 'available') {
      console.log("❌ Schedule is not available, status:", schedule[0].status);
      return NextResponse.json(
        { error: "Schedule is not available" },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada booking untuk schedule ini
    const [existingBooking] = await db.execute(
      `SELECT id FROM bookings 
       WHERE schedule_id = ? 
       AND status IN ('pending', 'confirmed')`,
      [schedule_id]
    );

    if (existingBooking.length > 0) {
      console.log("❌ Schedule already has booking");
      return NextResponse.json(
        { error: "Schedule already booked" },
        { status: 400 }
      );
    }

    // ✅ PERBAIKAN 2: Pastikan kolom topic ada di tabel bookings
    // Insert booking
    console.log("📝 Inserting booking...");
    const [result] = await db.execute(
      `INSERT INTO bookings 
       (student_id, schedule_id, topic, notes, status, created_at) 
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [student_id, schedule_id, topic, notes || ""]
    );

    const bookingId = result.insertId;
    console.log("✅ Booking inserted with ID:", bookingId);

    // Update schedule status
    await db.execute(
      "UPDATE schedules SET status = 'booked' WHERE id = ?",
      [schedule_id]
    );
    console.log("✅ Schedule status updated to 'booked'");

    // Get booking details for response
    const [newBooking] = await db.execute(
      `SELECT 
        b.*,
        s.date,
        s.start_time,
        s.end_time,
        c.user_id as counselor_user_id
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN counselors c ON s.counselor_id = c.id
       WHERE b.id = ?`,
      [bookingId]
    );

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking_id: bookingId,
        status: "pending",
        booking: newBooking[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error.message,
        sqlError: error.sqlMessage || "No SQL error",
      },
      { status: 500 }
    );
  }
}