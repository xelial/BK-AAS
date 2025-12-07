import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import LogoutButton from "@/app/components/LogOutButton";
import { redirect } from "next/navigation";
import Navigation2 from "../components/Navbar";
import HeroHeader11 from "../components/HeroHeader11";
import CounselorList from "../components/CounselorList";
import Copyright3 from "../components/Footer";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    redirect("/auth/login");
  }
  const user = session?.user;
  return (
    <div>
      <Navigation2 />
      <HeroHeader11 />
      <CounselorList />
      <Copyright3 />
    </div>
  );
}
