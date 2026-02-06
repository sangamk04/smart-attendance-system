import { useState } from "react";
import { useLogin, useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserCircle2, ArrowRight, Loader2 } from "lucide-react";

const adminSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee code is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate: login, isPending } = useLogin();
  const { data: user } = useUser();
  const [activeTab, setActiveTab] = useState<"admin" | "employee">("employee");

  // Redirect if already logged in
  if (user) {
    if (user.role === "admin") setLocation("/admin/dashboard");
    else setLocation("/employee/dashboard");
    return null;
  }

  const adminForm = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { username: "", password: "" },
  });

  const employeeForm = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { employeeCode: "" },
  });

  const onAdminSubmit = (data: z.infer<typeof adminSchema>) => {
    login(
      { ...data, loginType: "admin" },
      {
        onSuccess: (user) => {
          toast({ title: "Welcome back!", description: `Logged in as ${user.name}` });
          setLocation("/admin/dashboard");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Login failed", description: err.message });
        },
      }
    );
  };

  const onEmployeeSubmit = (data: z.infer<typeof employeeSchema>) => {
    login(
      { ...data, loginType: "employee" },
      {
        onSuccess: (user) => {
          toast({ title: "Welcome!", description: `Logged in as ${user.name}` });
          setLocation("/employee/dashboard");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Login failed", description: err.message });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
            AttendanceWala
          </h1>
          <p className="text-muted-foreground">Secure attendance management system</p>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-primary/5 backdrop-blur-xl bg-card">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="employee">Employee</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                    <FormField
                      control={adminForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserCircle2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9" placeholder="admin" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In as Admin"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="employee">
                <Form {...employeeForm}>
                  <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-4">
                    <FormField
                      control={employeeForm.control}
                      name="employeeCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Code</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9" placeholder="EMP-1234" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="flex items-center">
                          Sign In <ArrowRight className="ml-2 w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
