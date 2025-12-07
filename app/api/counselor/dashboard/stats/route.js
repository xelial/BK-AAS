import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const counselorId = counselor[0].id;
    const today = new Date().toISOString().split("T")[0];

    // Get total bookings
    const [totalBookings] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE s.counselor_id = ?`,
      [counselorId]
    );

    // Get pending bookings
    const [pendingBookings] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE s.counselor_id = ? AND b.status = 'pending'`,
      [counselorId]
    );

    // Get upcoming sessions (confirmed bookings for today and future)
    const [upcomingSessions] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE s.counselor_id = ? 
         AND b.status = 'confirmed'
         AND s.date >= ?`,
      [counselorId, today]
    );

    // Get available slots
    const [availableSlots] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM schedules 
       WHERE counselor_id = ? 
         AND status = 'available'
         AND date >= ?`,
      [counselorId, today]
    );

    return NextResponse.json({
      totalBookings: totalBookings[0].count,
      pendingBookings: pendingBookings[0].count,
      upcomingSessions: upcomingSessions[0].count,
      availableSlots: availableSlots[0].count,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
