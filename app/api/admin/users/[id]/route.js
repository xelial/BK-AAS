import { NextResponse } from "next/server";
import db from "@/app/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Get single user
// app/api/admin/users/[id]/route.js - GET handler
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ambil id dari params dengan await
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    const [users] = await db.execute(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// app/api/admin/users/[id]/route.js - PUT handler
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ambil id dari params dengan await
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);
    const data = await request.json();

    // Cek jika user ada
    const [existingUser] = await db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const oldRole = existingUser[0].role;
    
    // Update user
    let updateFields = [];
    let updateValues = [];

    if (data.name && data.name.trim() !== '') {
      updateFields.push('name = ?');
      updateValues.push(data.name.trim());
    }

    if (data.email && data.email.trim() !== '') {
      // Cek jika email sudah digunakan oleh user lain
      const [emailCheck] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [data.email.trim(), userId]
      );

      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }

      updateFields.push('email = ?');
      updateValues.push(data.email.trim());
    }

    if (data.password && data.password.trim() !== '') {
      updateFields.push('password = ?');
      updateValues.push(data.password.trim());
    }

    if (data.role && data.role !== oldRole) {
      updateFields.push('role = ?');
      updateValues.push(data.role);

      // Handle role change logic
      if (oldRole === 'counselor' && data.role !== 'counselor') {
        // Hapus dari counselors jika role berubah dari counselor
        await db.execute(
          'DELETE FROM counselors WHERE user_id = ?',
          [userId]
        );
      } else if (oldRole !== 'counselor' && data.role === 'counselor') {
        // Tambah ke counselors jika role berubah menjadi counselor
        const [counselorCheck] = await db.execute(
          'SELECT id FROM counselors WHERE user_id = ?',
          [userId]
        );

        if (counselorCheck.length === 0) {
          await db.execute(
            'INSERT INTO counselors (user_id, bio) VALUES (?, ?)',
            [userId, 'BK Counselor']
          );
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('Update query:', query);
    console.log('Update values:', updateValues);
    
    const [updateResult] = await db.execute(query, updateValues);

    return NextResponse.json({
      message: 'User updated successfully',
      affectedRows: updateResult.affectedRows
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete user
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Debug: Log params untuk melihat apa yang diterima
    console.log('DELETE request params:', params);
    
    // Ambil id dari params dengan benar
    const { id } = await params; // Perhatikan await di sini!
    
    // Validasi id
    if (!id || isNaN(parseInt(id))) {
      console.error('Invalid user ID:', id);
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);
    console.log('Deleting user with ID:', userId);

    // Cek jika user ada
    const [existingUser] = await db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId] // Gunakan userId yang sudah divalidasi
    );

    if (existingUser.length === 0) {
      console.log('User not found with ID:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRole = existingUser[0].role;
    console.log('User role:', userRole);

    // Handle cascade deletion berdasarkan role
    if (userRole === 'counselor') {
      // Cari counselor_id terlebih dahulu
      const [counselor] = await db.execute(
        'SELECT id FROM counselors WHERE user_id = ?',
        [userId]
      );
      
      if (counselor.length > 0) {
        const counselorId = counselor[0].id;
        console.log('Deleting counselor with ID:', counselorId);
        
        // Hapus schedules yang terkait dengan counselor
        await db.execute(
          'DELETE FROM schedules WHERE counselor_id = ?',
          [counselorId]
        );
        
        // Hapus counselor
        await db.execute(
          'DELETE FROM counselors WHERE id = ?',
          [counselorId]
        );
      }
    } else if (userRole === 'student') {
      // Hapus bookings yang dibuat oleh student
      await db.execute(
        'DELETE FROM bookings WHERE student_id = ?',
        [userId]
      );
    }

    // Hapus user
    const [deleteResult] = await db.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    console.log('User deleted successfully:', deleteResult.affectedRows, 'rows affected');

    return NextResponse.json({
      message: 'User deleted successfully',
      affectedRows: deleteResult.affectedRows
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: error.message,
        sqlError: error.sqlMessage 
      },
      { status: 500 }
    );
  }
}