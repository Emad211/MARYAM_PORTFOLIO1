"use client"

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/admin/main-sidebar";
import { Header } from "@/components/admin/header";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AdminDashboardSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
       <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
          </div>
       </div>
    </div>
  )
}

function AdminArea({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Only an admin session may see the admin shell. The proxy already gates
    // /admin on the server; this is the client-side fallback for a session that
    // changes while the page is open (cookie cleared, or a student who somehow
    // reaches this tree). A non-admin is sent to login.
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, loading, router]);


    if (loading || !isAdmin) {
        return <AdminDashboardSkeleton />;
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen">
                <Sidebar>
                    <MainSidebar />
                </Sidebar>
                <div className="flex flex-1 flex-col">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-8 bg-muted/40">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return <AdminArea>{children}</AdminArea>
}
