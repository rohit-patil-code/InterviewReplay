"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Brain, 
  LayoutDashboard, 
  Code2, 
  History, 
  Settings, 
  Menu, 
  LogOut, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Practice", href: "/dashboard/practice", icon: Code2 },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-border bg-card/50 backdrop-blur-xl z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Brain className="h-5 w-5 text-primary" />
             </div>
             <span className="font-bold text-lg tracking-tight">OA Recall</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@example.com</p>
            </div>
             <LogOut className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </aside>

      {/* 2. Mobile Layout */}
      <div className="md:hidden flex flex-col">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 justify-between">
           <div className="flex items-center gap-3">
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="-ml-2">
                   <Menu className="h-5 w-5" />
                   <span className="sr-only">Toggle menu</span>
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="w-72 p-0 flex flex-col">
                 <div className="h-16 flex items-center px-6 border-b border-border/50">
                    <Link href="/" className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-primary" />
                       </div>
                       <span className="font-bold text-lg tracking-tight">OA Recall</span>
                    </Link>
                 </div>
                 <nav className="flex-1 py-6 px-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          {item.label}
                        </Link>
                      );
                    })}
                 </nav>
                 <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">Free Plan</p>
                      </div>
                    </div>
                 </div>
               </SheetContent>
             </Sheet>
             <span className="font-semibold">Dashboard</span>
           </div>
           
           <Avatar className="h-8 w-8">
             <AvatarFallback className="text-xs">JD</AvatarFallback>
           </Avatar>
        </header>
      </div>

      {/* 3. Main Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
           {children}
        </div>
      </main>
    </div>
  );
}
