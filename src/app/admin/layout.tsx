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

    useEffect(() => {
        // This effect only runs on the client after initial load.
        // The middleware has already protected the route on the server.
        // This handles the case where a cookie might be deleted while the user is on the page.
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


    if (loading || !user) {
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
