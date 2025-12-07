import { redirect } from "next/navigation";
import CounselorList from "./components/CounselorList";
import Copyright3 from "./components/Footer";
import HeroHeader11 from "./components/HeroHeader11";
import Navigation2 from "./components/Navbar";

export default function Home() {
  return redirect("/auth/login");
}
