import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { checkAdminAccess } from "@/lib/authHelper";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await checkAdminAccess();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content">
        <div className="content-inner">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
