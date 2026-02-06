import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  LogOut, 
  QrCode, 
  Menu,
  X 
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Building2 },
    { href: "/admin/offices", label: "Offices", icon: Building2 },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  ];

  const employeeLinks = [
    { href: "/employee/dashboard", label: "Dashboard", icon: QrCode },
    { href: "/employee/attendance", label: "My Attendance", icon: ClipboardCheck },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-display">
          CheckIn<span className="text-foreground">Pro</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? "Admin Portal" : "Employee Portal"}
        </p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
                <Icon className="w-5 h-5" />
                {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-sidebar backdrop-blur-xl h-screen sticky top-0 overflow-y-auto">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-b z-50 px-4 flex items-center justify-between">
         <h1 className="text-xl font-bold font-display">AttendanceWala</h1>
         <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
           <SheetTrigger asChild>
             <Button variant="ghost" size="icon">
               <Menu className="w-6 h-6" />
             </Button>
           </SheetTrigger>
           <SheetContent side="left" className="p-0 w-80">
             <NavContent />
           </SheetContent>
         </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full overflow-y-auto animate-in">
        {children}
      </main>
    </div>
  );
}
