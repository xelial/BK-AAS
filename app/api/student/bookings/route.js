import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  console.log("📞 API Student Bookings GET called");

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
        { error: "Only students can view their bookings" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") || 10;

    let query = `
      SELECT 
        b.id as booking_id,
        b.topic,
        b.notes,
        b.status as booking_status,
        b.created_at,
        s.date,
        s.start_time,
        s.end_time,
        s.status as schedule_status,
        c.id as counselor_id,
        u.name as counselor_name,
        u.email as counselor_email,
        c.profile_picture as counselor_photo
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN counselors c ON s.counselor_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE b.student_id = ?
    `;

    const params = [session.user.id];

    if (status && status !== "all") {
      query += " AND b.status = ?";
      params.push(status);
    }

    query += " ORDER BY s.date DESC, s.start_time DESC LIMIT ?";
    params.push(parseInt(limit));

    console.log("📝 SQL Query:", query);
    console.log("📝 SQL Params:", params);

    const [bookings] = await db.execute(query, params);

    console.log(`✅ Found ${bookings.length} bookings for student`);

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("❌ Error in /api/student/bookings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch student bookings",
        details: error.message,
        sqlError: error.sqlMessage,
      },
      { status: 500 }
    );
  }
}