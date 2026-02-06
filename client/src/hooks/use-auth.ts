import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest, type AuthResponse } from "@shared/routes";

export function useUser() {
  const query = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  return query;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid credentials");
        }
        throw new Error("Login failed");
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.invalidateQueries(); // Clear all data
    },
  });
}
