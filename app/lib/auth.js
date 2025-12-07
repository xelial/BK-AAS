"use server";

import db from "./database";
import { redirect } from "next/navigation";


export async function storeUser(formData) {
  const email = formData.get("email");
  const username = formData.get("username");
  const password = formData.get("password");
  const role = formData.get("role");

  try {
    // Simpan password sebagai plain text
    await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, password, role]
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate email error
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Email already exists");
    }
  }
}

export async function getUserByEmail(email) {
  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) return null;

    return users[0];
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
