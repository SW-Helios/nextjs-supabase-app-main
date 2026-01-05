import { AdminSidebar } from "@/components/navigation/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 p-8 dark:bg-gray-900">{children}</main>
    </div>
  );
}
