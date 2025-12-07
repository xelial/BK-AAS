import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { action } = await request.json();

    if (!["confirm", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

    // Check if booking exists and belongs to counselor
    const [bookingCheck] = await db.execute(
      `SELECT b.id 
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE b.id = ? AND s.counselor_id = ?`,
      [id, counselorId]
    );

    if (bookingCheck.length === 0) {
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update booking status
    const newStatus = action === "confirm" ? "confirmed" : "cancelled";

    await db.execute(
      "UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id]
    );

    // If cancelled, also update schedule status back to available
    if (action === "cancel") {
      await db.execute(
        `UPDATE schedules s
         JOIN bookings b ON s.id = b.schedule_id
         SET s.status = 'available', s.updated_at = NOW()
         WHERE b.id = ?`,
        [id]
      );
    }

    return NextResponse.json({
      message: `Booking ${
        action === "confirm" ? "confirmed" : "cancelled"
      } successfully`,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
