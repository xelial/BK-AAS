import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  console.log("📞 API Counselor List GET called");

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

    // Ambil daftar counselor (untuk semua role)
    const [counselors] = await db.execute(`
      SELECT 
        c.*,
        u.name,
        u.email,
        u.role,
        COUNT(DISTINCT s.id) as total_schedules
      FROM counselors c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN schedules s ON c.id = s.counselor_id 
        AND s.status = 'available' 
        AND s.date >= CURDATE()
      GROUP BY c.id
      ORDER BY u.name
    `);

    console.log(`✅ Found ${counselors.length} counselors`);

    return NextResponse.json(counselors);
  } catch (error) {
    console.error("❌ Error in /api/counselor:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch counselors",
        details: error.message,
        sqlError: error.sqlMessage,
      },
      { status: 500 }
    );
  }
}