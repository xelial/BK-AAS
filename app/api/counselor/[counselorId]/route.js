import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  console.log("📞 API Counselor Detail GET called");

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

    // PERBAIKAN: Await params
    const { counselorId } = await params;
    console.log("🎯 Requested counselorId from URL:", counselorId);

    // Query untuk mendapatkan detail counselor
    const [counselor] = await db.execute(
      `SELECT c.*, u.name, u.email, u.role 
       FROM counselors c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [counselorId]
    );

    if (counselor.length === 0) {
      return NextResponse.json(
        { error: "Counselor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(counselor[0]);
  } catch (error) {
    console.error("❌ Error in /api/counselor/[counselorId]:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch counselor",
        details: error.message,
        sqlError: error.sqlMessage,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PERBAIKAN: Await params
    const { counselorId } = await params;

    // Cek apakah counselor yang diakses adalah milik user
    const [counselor] = await db.execute(
      "SELECT id FROM counselors WHERE id = ? AND user_id = ?",
      [counselorId, session.user.id]
    );

    if (counselor.length === 0) {
      return NextResponse.json(
        { error: "Counselor not found or unauthorized" },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Update counselor profile
    await db.execute(
      "UPDATE counselors SET bio = ?, specialization = ? WHERE id = ?",
      [data.bio, data.specialization, counselorId]
    );

    return NextResponse.json({ message: "Counselor updated successfully" });
  } catch (error) {
    console.error("Error updating counselor:", error);
    return NextResponse.json(
      { error: "Failed to update counselor" },
      { status: 500 }
    );
  }
}