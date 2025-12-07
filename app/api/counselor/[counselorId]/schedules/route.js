import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  console.log("📞 API Counselor Schedules for Student GET called");

  try {
    // Cek session - TETAP HARUS DI AWAL
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    console.log("👤 Session user:", session.user);

    // PERBAIKAN DI SINI: params adalah Promise, jadi harus di-await
    const { counselorId } = await params;
    console.log("🎯 Requested counselorId from URL:", counselorId);

    // Validasi counselorId
    if (!counselorId) {
      return NextResponse.json(
        { error: "Counselor ID is required" },
        { status: 400 }
      );
    }

    // Cek apakah counselor dengan counselorId tersebut ada
    const [counselor] = await db.execute(
      "SELECT c.*, u.name, u.email FROM counselors c JOIN users u ON c.user_id = u.id WHERE c.id = ?",
      [counselorId]
    );

    if (counselor.length === 0) {
      return NextResponse.json(
        { error: "Counselor not found" },
        { status: 404 }
      );
    }

    // Hanya tampilkan jadwal yang available untuk student
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");

    let query = `
      SELECT 
        s.*,
        TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) as duration
      FROM schedules s
      WHERE s.counselor_id = ?
        AND s.status = 'available'
        AND s.date >= ?
        AND NOT EXISTS (
          SELECT 1 FROM bookings b 
          WHERE b.schedule_id = s.id 
          AND b.status IN ('pending', 'confirmed')
        )
    `;

    const queryParams = [counselorId, startDate || new Date().toISOString().split("T")[0]];

    query += " ORDER BY s.date, s.start_time";

    console.log("📝 SQL Query:", query);
    console.log("📝 SQL Params:", queryParams);

    const [schedules] = await db.execute(query, queryParams);

    console.log(`✅ Found ${schedules.length} available schedules for counselor ${counselorId}`);

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("❌ Error in /api/counselor/[counselorId]/schedules:", error);
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