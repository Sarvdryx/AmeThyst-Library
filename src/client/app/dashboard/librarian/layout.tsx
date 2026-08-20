import { NavBar, Footer, LibrarianDashboardSidebar } from '../../components/organisms';

export default function LibrarianDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F3E9] dark:bg-neutral-900">
      <NavBar />
      <div className="flex flex-1">
        <LibrarianDashboardSidebar />
        <main className="flex-1 p-8 pl-10 flex flex-col gap-8 min-w-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
