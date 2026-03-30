import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/**
 * Shell for all authenticated and login routes: sticky header + page content + fixed footer.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-app-bg text-ink flex flex-col">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
