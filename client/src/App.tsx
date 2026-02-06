import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOffices from "@/pages/admin/offices";
import AdminEmployees from "@/pages/admin/employees";
import AdminAttendance from "@/pages/admin/attendance";

// Employee Pages
import EmployeeDashboard from "@/pages/employee/dashboard";
import EmployeeAttendance from "@/pages/employee/attendance";

function ProtectedRoute({ 
  component: Component, 
  allowedRole 
}: { 
  component: React.ComponentType, 
  allowedRole?: 'admin' | 'employee' 
}) {
  const { data: user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect based on their actual role
    if (user.role === 'admin') setLocation("/admin/dashboard");
    else setLocation("/employee/dashboard");
    return null;
  }

  return (
    <LayoutShell>
      <Component />
    </LayoutShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} allowedRole="admin" />
      </Route>
      <Route path="/admin/offices">
        <ProtectedRoute component={AdminOffices} allowedRole="admin" />
      </Route>
      <Route path="/admin/employees">
        <ProtectedRoute component={AdminEmployees} allowedRole="admin" />
      </Route>
      <Route path="/admin/attendance">
        <ProtectedRoute component={AdminAttendance} allowedRole="admin" />
      </Route>

      {/* Employee Routes */}
      <Route path="/employee/dashboard">
        <ProtectedRoute component={EmployeeDashboard} allowedRole="employee" />
      </Route>
      <Route path="/employee/attendance">
        <ProtectedRoute component={EmployeeAttendance} allowedRole="employee" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
