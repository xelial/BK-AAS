import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request, context) {
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

    // Get booking ID from params
    const { id } = await context.params;
    const counselorId = counselor[0].id;
    const data = await request.json();
    const { status } = data;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Check if booking belongs to this counselor
    const [booking] = await db.execute(
      `SELECT b.*, s.counselor_id 
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE b.id = ? AND s.counselor_id = ?`,
      [id, counselorId]
    );

    if (booking.length === 0) {
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 }
      );
    }

    const currentStatus = booking[0].status;

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Update booking status
    await db.execute(
      "UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id]
    );

    // Update schedule status if needed
    if (status === "cancelled") {
      await db.execute(
        "UPDATE schedules SET status = 'available' WHERE id = ?",
        [booking[0].schedule_id]
      );
    } else if (status === "confirmed") {
      await db.execute(
        "UPDATE schedules SET status = 'booked' WHERE id = ?",
        [booking[0].schedule_id]
      );
    }

    return NextResponse.json({
      message: "Booking status updated successfully",
      status,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}