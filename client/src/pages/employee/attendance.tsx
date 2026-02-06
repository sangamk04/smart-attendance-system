import { useMyAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeAttendance() {
  const { data: records, isLoading } = useMyAttendance();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "text-green-600 bg-green-50 border-green-200";
      case "late": return "text-orange-600 bg-orange-50 border-orange-200";
      case "half-day": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "absent": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Attendance History</h2>
        <p className="text-muted-foreground mt-2">View your past check-ins and attendance status.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : records && records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(record.status)} capitalize`}>
                        {record.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
