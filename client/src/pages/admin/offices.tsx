import { useState } from "react";
import { useOffices, useCreateOffice } from "@/hooks/use-offices";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Loader2, QrCode as QrIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const createOfficeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  checkInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  checkOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export default function AdminOffices() {
  const { data: offices, isLoading } = useOffices();
  const { mutate: createOffice, isPending } = useCreateOffice();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrModalOffice, setQrModalOffice] = useState<{ id: number; name: string } | null>(null);

  const form = useForm<z.infer<typeof createOfficeSchema>>({
    resolver: zodResolver(createOfficeSchema),
    defaultValues: {
      name: "",
      checkInTime: "09:00",
      checkOutTime: "17:00",
      latitude: 0,
      longitude: 0,
    },
  });

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation not supported" });
      return;
    }
    toast({ title: "Fetching location...", description: "Please allow browser permission." });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude);
        form.setValue("longitude", pos.coords.longitude);
        toast({ title: "Location fetched!", description: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
      },
      (err) => {
        toast({ variant: "destructive", title: "Location error", description: err.message });
      }
    );
  };

  const onSubmit = (data: z.infer<typeof createOfficeSchema>) => {
    createOffice(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Office created successfully" });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Office Management</h2>
          <p className="text-muted-foreground mt-2">Create offices and generate QR codes for attendance.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Office
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Office</DialogTitle>
              <DialogDescription>Define office location and work hours.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Name</FormLabel>
                      <FormControl>
                        <Input placeholder="HQ - New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check In</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check Out</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <FormLabel>Coordinates</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={fetchLocation}>
                      <MapPin className="w-3 h-3 mr-1" /> Fetch Location
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Lat" {...field} readOnly className="bg-muted" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Long" {...field} readOnly className="bg-muted" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Using your current browser location.</p>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Office"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : offices && offices.length > 0 ? (
                offices.map((office) => (
                  <TableRow key={office.id}>
                    <TableCell className="font-medium">{office.name}</TableCell>
                    <TableCell>{office.checkInTime} - {office.checkOutTime}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setQrModalOffice(office)}>
                        <QrIcon className="w-4 h-4 mr-2" /> QR Code
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No offices found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={!!qrModalOffice} onOpenChange={(open) => !open && setQrModalOffice(null)}>
        <DialogContent className="sm:max-w-sm flex flex-col items-center">
          <DialogHeader className="text-center">
            <DialogTitle>Office QR Code</DialogTitle>
            <DialogDescription>Scan this code to check in at {qrModalOffice?.name}</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white rounded-xl shadow-inner border">
            {qrModalOffice && (
              <QRCodeSVG 
                value={String(qrModalOffice.id)} // Just sending ID is enough, handled by frontend scanner
                size={200}
                level="H"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Print this code and place it at the office entrance.<br/>
            Employees must be within range to scan.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
