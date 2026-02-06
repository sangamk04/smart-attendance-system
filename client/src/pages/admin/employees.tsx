import { useState } from "react";
import { useEmployees, useCreateEmployee } from "@/hooks/use-employees";
import { useOffices } from "@/hooks/use-offices";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Copy } from "lucide-react";

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  officeId: z.string().min(1, "Office is required"), // Select returns string
});

export default function AdminEmployees() {
  const { data: employees, isLoading } = useEmployees();
  const { data: offices } = useOffices();
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createEmployeeSchema>>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { name: "", officeId: "" },
  });

  const onSubmit = (data: z.infer<typeof createEmployeeSchema>) => {
    createEmployee(
      { ...data, officeId: parseInt(data.officeId) }, 
      {
        onSuccess: (response) => {
          toast({ title: "Success", description: "Employee created" });
          setNewlyCreatedCode(response.employeeCode);
          form.reset();
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message });
        },
      }
    );
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Employee code copied to clipboard." });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-muted-foreground mt-2">Add employees and assign them to offices.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if(!open) setNewlyCreatedCode(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Create an employee account. They will receive a unique code.</DialogDescription>
            </DialogHeader>

            {newlyCreatedCode ? (
              <div className="py-6 text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800 mb-2 font-medium">Employee Created Successfully!</p>
                  <p className="text-xs text-green-600 mb-4">Share this code with the employee for login.</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-mono font-bold text-green-900 bg-white px-4 py-2 rounded border border-green-200">
                      {newlyCreatedCode}
                    </code>
                    <Button size="icon" variant="ghost" onClick={() => copyCode(newlyCreatedCode)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={() => { setIsDialogOpen(false); setNewlyCreatedCode(null); }} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="officeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Office</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select office" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {offices?.map((office) => (
                              <SelectItem key={office.id} value={String(office.id)}>
                                {office.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Employee"}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        {emp.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{emp.employeeCode || "N/A"}</TableCell>
                    <TableCell>{emp.office?.name || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {emp.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No employees found.
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
