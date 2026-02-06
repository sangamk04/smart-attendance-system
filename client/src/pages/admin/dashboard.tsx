import { useUser } from "@/hooks/use-auth";
import { useOffices } from "@/hooks/use-offices";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, ClipboardCheck, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: user } = useUser();
  const { data: offices } = useOffices();
  const { data: employees } = useEmployees();
  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance } = useAttendance({ date: today });

  if (!user) return null;

  const stats = [
    {
      title: "Active Employees",
      value: employees?.length || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/employees"
    },
    {
      title: "Office Locations",
      value: offices?.length || 0,
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/admin/offices"
    },
    {
      title: "Checked In Today",
      value: attendance?.filter(a => a.checkInTime).length || 0,
      icon: ClipboardCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/attendance"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">Welcome back, {user.name}. Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-lg transition-all cursor-pointer border-border/50 hover:border-primary/50 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    View details 
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Section could go here */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
          <CardDescription>Real-time attendance updates for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance && attendance.length > 0 ? (
              attendance.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {record.user?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{record.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{record.status}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Check-in</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No attendance records for today yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
