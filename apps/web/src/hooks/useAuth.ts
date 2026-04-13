import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import type { LoginInput, RegisterInput } from "@loop/shared";

type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

export function useMe() {
  return useQuery<{ user: User }>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginInput) => api.post<{ user: User }>("/auth/login", data),
    onSuccess: (data) => {
      qc.setQueryData(["me"], data);
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterInput) => api.post<{ user: User }>("/auth/register", data),
    onSuccess: (data) => {
      qc.setQueryData(["me"], data);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      qc.clear();
    },
  });
}
