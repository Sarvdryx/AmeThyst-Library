import { NavBar, Footer, AdminDashboardSidebar } from '../../components/organisms';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-amber-50 dark:bg-neutral-950">
      <NavBar variant="admin" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminDashboardSidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 lg:pl-10">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
