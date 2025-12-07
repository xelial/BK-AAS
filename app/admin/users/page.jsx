import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import UsersList from "@/app/components/admin/UsersList";
import AddUserForm from "@/app/components/admin/AddUserForm";
import Navigation2 from "@/app/components/Navbar";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  // Cek jika user tidak login atau bukan admin
  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/test");
  }

  return (
    <div>
      <Navigation2 />
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Manajemen User
                </h1>
                <p className="text-gray-600 mt-2">
                  Kelola semua user sistem BK Counselor
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Tambah User */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Tambah User Baru
                </h2>
                <AddUserForm />
              </div>
            </div>

            {/* List Users */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Daftar User
                  </h2>
                  <div className="text-sm text-gray-500">
                    Total:{" "}
                    <span className="font-semibold">
                      {/* akan diisi oleh client component */}
                    </span>
                  </div>
                </div>
                <UsersList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
