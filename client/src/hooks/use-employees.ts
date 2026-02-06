import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateEmployeeRequest } from "@shared/routes";
const API_BASE = "http://localhost:5000";
// export function useEmployees() {
//   return useQuery({
//     queryKey: [api.employees.list.path],
//     queryFn: async () => {
//       const res = await fetch(api.employees.list.path);
//       if (!res.ok) throw new Error("Failed to fetch employees");
//       return api.employees.list.responses[200].parse(await res.json());
//     },
//   });
// }
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/employees`);
      if (!res.ok) {
        const err = await res.text();
        console.error("EMPLOYEE API ERROR:", err);
        throw new Error("Failed to fetch employees");
      }
      return res.json();
    },
  });
}
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest) => {
      // Coerce officeId to number if it comes from a string value
      const payload = {
        ...data,
        officeId: Number(data.officeId),
      };
      
      console.log("Creating employee with payload:", payload);
      
      const validated = api.employees.create.input.parse(payload);
      console.log("Validated payload:", validated);
      
      const res = await fetch(api.employees.create.path, {
        method: api.employees.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      const responseData = await res.json();
      console.log("Server response:", responseData);

      if (!res.ok) {
        if (res.status === 400) {
          throw new Error(JSON.stringify(responseData));
        }
        throw new Error("Failed to create employee");
      }
      return api.employees.create.responses[201].parse(responseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
    },
  });
}
