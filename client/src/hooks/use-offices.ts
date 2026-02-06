import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateOfficeRequest } from "@shared/routes";

export function useOffices() {
  return useQuery({
    queryKey: [api.offices.list.path],
    queryFn: async () => {
      const res = await fetch(api.offices.list.path);
      if (!res.ok) throw new Error("Failed to fetch offices");
      return api.offices.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateOffice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOfficeRequest) => {
      const validated = api.offices.create.input.parse(data);
      const res = await fetch(api.offices.create.path, {
        method: api.offices.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.offices.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create office");
      }
      return api.offices.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.offices.list.path] });
    },
  });
}
