import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// PUT: Update schedule
export async function PUT(request, context) {
  console.log("📞 API Counselor Schedule Update PUT called");

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

    // Get schedule ID from params
    const { id } = await context.params;
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    console.log("🎯 Updating schedule ID:", scheduleId);

    const data = await request.json();
    console.log("📦 Update data:", data);

    // Cek apakah schedule milik counselor ini
    const [schedule] = await db.execute(
      "SELECT id FROM schedules WHERE id = ? AND counselor_id = ?",
      [scheduleId, counselorId]
    );

    if (schedule.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 }
      );
    }

    // Validasi jika ada update waktu
    if (data.start_time || data.end_time) {
      const startTime = data.start_time || "";
      const endTime = data.end_time || "";

      if (startTime && endTime) {
        // Format waktu
        const formattedStartTime = startTime.includes(":")
          ? startTime
          : `${startTime}:00`;
        const formattedEndTime = endTime.includes(":")
          ? endTime
          : `${endTime}:00`;

        // Cek apakah start time sebelum end time
        if (formattedStartTime >= formattedEndTime) {
          return NextResponse.json(
            { error: "Start time must be before end time" },
            { status: 400 }
          );
        }

        // Cek durasi minimal
        const start = new Date(`2000-01-01T${formattedStartTime}`);
        const end = new Date(`2000-01-01T${formattedEndTime}`);
        const durationMinutes = (end - start) / (1000 * 60);

        if (durationMinutes < 30) {
          return NextResponse.json(
            { error: "Minimum duration is 30 minutes" },
            { status: 400 }
          );
        }

        // Cek bentrok dengan schedule lain (kecuali schedule ini sendiri)
        const [conflicting] = await db.execute(
          `SELECT id FROM schedules 
           WHERE counselor_id = ? 
             AND id != ?
             AND date = ? 
             AND (
               (start_time < ? AND end_time > ?) OR
               (start_time >= ? AND start_time < ?) OR
               (end_time > ? AND end_time <= ?)
             )
           LIMIT 1`,
          [
            counselorId,
            scheduleId,
            data.date || schedule.date,
            formattedEndTime,
            formattedStartTime,
            formattedStartTime,
            formattedEndTime,
            formattedStartTime,
            formattedEndTime,
          ]
        );

        if (conflicting.length > 0) {
          return NextResponse.json(
            { error: "Schedule conflicts with existing schedule" },
            { status: 400 }
          );
        }

        // Update waktu yang sudah diformat
        if (data.start_time) {
          data.start_time = formattedStartTime;
        }
        if (data.end_time) {
          data.end_time = formattedEndTime;
        }
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (data.date !== undefined) {
      updateFields.push("date = ?");
      updateValues.push(data.date);
    }

    if (data.start_time !== undefined) {
      updateFields.push("start_time = ?");
      updateValues.push(data.start_time);
    }

    if (data.end_time !== undefined) {
      updateFields.push("end_time = ?");
      updateValues.push(data.end_time);
    }

    if (data.status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(data.status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Tambahkan WHERE clause parameters
    updateValues.push(scheduleId, counselorId);

    const query = `UPDATE schedules SET ${updateFields.join(", ")} WHERE id = ? AND counselor_id = ?`;

    console.log("📝 Update query:", query);
    console.log("📝 Update values:", updateValues);

    await db.execute(query, updateValues);

    // Ambil schedule yang sudah diupdate
    const [updatedSchedule] = await db.execute(
      `SELECT s.*, TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) as duration 
       FROM schedules s WHERE id = ?`,
      [scheduleId]
    );

    console.log("✅ Schedule updated:", updatedSchedule[0]);

    return NextResponse.json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule[0],
    });
  } catch (error) {
    console.error("❌ Error updating schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to update schedule",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete schedule
export async function DELETE(request, context) {
  console.log("📞 API Counselor Schedule Delete DELETE called");

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

    // Get schedule ID from params
    const { id } = await context.params;
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting schedule ID:", scheduleId);

    // Cek apakah schedule milik counselor ini
    const [schedule] = await db.execute(
      "SELECT id, status FROM schedules WHERE id = ? AND counselor_id = ?",
      [scheduleId, counselorId]
    );

    if (schedule.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cek apakah schedule sudah dibooking
    const [booking] = await db.execute(
      "SELECT id FROM bookings WHERE schedule_id = ? AND status IN ('pending', 'confirmed')",
      [scheduleId]
    );

    if (booking.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete schedule with active booking" },
        { status: 400 }
      );
    }

    // Hapus schedule
    await db.execute(
      "DELETE FROM schedules WHERE id = ? AND counselor_id = ?",
      [scheduleId, counselorId]
    );

    console.log("✅ Schedule deleted");

    return NextResponse.json({
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to delete schedule",
        details: error.message,
      },
      { status: 500 }
    );
  }
}