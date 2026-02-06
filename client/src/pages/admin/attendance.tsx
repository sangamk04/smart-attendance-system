import { useState } from "react";
import { useAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Filter } from "lucide-react";
import { format } from "date-fns";

export default function AdminAttendance() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const { data: records, isLoading } = useAttendance({
    status: filterStatus || undefined,
    date: filterDate || undefined
  });

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
        <h2 className="text-3xl font-bold tracking-tight">Attendance Records</h2>
        <p className="text-muted-foreground mt-2">Monitor daily check-ins and attendance status.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-40"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : records && records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {record.user?.name.charAt(0)}
                        </div>
                        {record.user?.name}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : '-'}
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No records found for this date.
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
