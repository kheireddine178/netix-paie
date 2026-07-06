import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
