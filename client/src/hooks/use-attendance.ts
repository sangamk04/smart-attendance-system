import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ScanAttendanceRequest } from "@shared/routes";

export function useAttendance(filters?: { status?: string; date?: string }) {
  const url = new URL(api.attendance.list.path, window.location.origin);
  if (filters?.status) url.searchParams.append("status", filters.status);
  if (filters?.date) url.searchParams.append("date", filters.date);

  return useQuery({
    queryKey: [api.attendance.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return api.attendance.list.responses[200].parse(await res.json());
    },
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: [api.attendance.me.path],
    queryFn: async () => {
      const res = await fetch(api.attendance.me.path);
      if (!res.ok) throw new Error("Failed to fetch your attendance");
      return api.attendance.me.responses[200].parse(await res.json());
    },
  });
}

export function useScanAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ScanAttendanceRequest) => {
      const validated = api.attendance.scan.input.parse(data);
      const res = await fetch(api.attendance.scan.path, {
        method: api.attendance.scan.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.attendance.scan.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Scan failed");
      }
      return api.attendance.scan.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.me.path] });
    },
  });
}
