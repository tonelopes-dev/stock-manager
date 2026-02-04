import Sidebar from "../_components/sidebar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-100">{children}</main>
      <Toaster />
    </div>
  );
}
