import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { useScanAttendance } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QrCode, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QrScanner from "react-qr-scanner";

export default function EmployeeDashboard() {
  const { data: user } = useUser();
  const { mutate: scanAttendance, isPending } = useScanAttendance();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  if (!user) return null;

  const handleScan = (data: any) => {
    if (data && !isPending) {
      // Prevent multiple rapid scans
      if (scanResult) return; 
      
      const qrContent = data?.text;
      if (!qrContent) return;

      setScanResult(qrContent);
      setIsScanning(false);
      
      // We have the QR code (officeId), now get geolocation
      if (!navigator.geolocation) {
        toast({ variant: "destructive", title: "Error", description: "Geolocation is not supported by your browser" });
        return;
      }

      toast({ title: "Processing...", description: "Verifying location and checking in." });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          scanAttendance(
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              officeId: parseInt(qrContent), // Assume QR contains simple ID string
            },
            {
              onSuccess: (data) => {
                toast({ 
                  title: "Success!", 
                  description: `Marked as ${data.status} at ${new Date().toLocaleTimeString()}` 
                });
                setScanResult(null); // Reset for next time
              },
              onError: (err) => {
                toast({ variant: "destructive", title: "Attendance Failed", description: err.message });
                setScanResult(null);
              }
            }
          );
        },
        (err) => {
          toast({ variant: "destructive", title: "Location Error", description: "Could not fetch your location. Please allow permissions." });
          setScanResult(null);
        }
      );
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    toast({ variant: "destructive", title: "Scanner Error", description: "Could not access camera." });
    setIsScanning(false);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h2>
        <p className="text-muted-foreground">Ready to start your day? Scan the office QR code.</p>
      </div>

      <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5 overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-6 min-h-[300px] bg-gradient-to-b from-white to-primary/5">
          <div className="p-6 bg-white rounded-full shadow-lg mb-2">
            <QrCode className="w-16 h-16 text-primary" />
          </div>
          
          <div className="text-center space-y-2 max-w-xs">
            <h3 className="font-semibold text-lg">Mark Attendance</h3>
            <p className="text-sm text-muted-foreground">
              Ensure you are within the office premises before scanning.
            </p>
          </div>

          <Button 
            size="lg" 
            className="w-full max-w-xs h-14 text-lg shadow-lg shadow-primary/25 rounded-xl transition-transform active:scale-95"
            onClick={() => setIsScanning(true)}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 mr-2" /> Scan QR Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Helper info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Office</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{user.office?.name || "Assigned Office"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
          </CardHeader>
          <CardContent>
             {/* This would ideally come from useMyAttendance checking today's record */}
             <div className="flex items-center gap-2 text-muted-foreground">
               <CheckCircle2 className="w-4 h-4" />
               <span>Check attendance history</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanning Modal */}
      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none">
          <div className="relative aspect-square">
            {isScanning && (
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%', height: '100%' }}
                constraints={{
                  audio: false,
                  video: { facingMode: "environment" }
                }}
              />
            )}
            <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20"
              onClick={() => setIsScanning(false)}
            >
              Cancel Scan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
