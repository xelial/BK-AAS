import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Get all users
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let query = `
      SELECT 
        id, 
        email, 
        name, 
        role, 
        created_at,
        updated_at
      FROM users
      WHERE 1=1
    `;

    const params = [];

    if (role && role !== "all") {
      query += " AND role = ?";
      params.push(role);
    }

    query += " ORDER BY created_at DESC";

    const [users] = await db.execute(query, params);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: Create new user
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validasi input
    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Cek jika email sudah terdaftar
    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [data.email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Insert user baru (tanpa enkripsi password - hanya untuk demo)
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [data.name, data.email, data.password, data.role]
    );

    // Jika role counselor, tambahkan ke tabel counselors
    if (data.role === "counselor") {
      await db.execute("INSERT INTO counselors (user_id, bio) VALUES (?, ?)", [
        result.insertId,
        "BK Counselor",
      ]);
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
