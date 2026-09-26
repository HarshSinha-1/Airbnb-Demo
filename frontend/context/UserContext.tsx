"use client";

import { api, setStoredUserId, getStoredUserId } from "@/lib/api";
import type { User } from "@/lib/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type UserContextValue = {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setCurrentUserId: (id: number) => void;
  refreshUsers: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getUsers();
      setUsers(list);
      const stored = getStoredUserId();
      const next =
        list.find((u) => u.id === stored) ??
        list.find((u) => !u.is_host) ??
        list[0] ??
        null;
      if (next) {
        setStoredUserId(next.id);
        setCurrentUser(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const setCurrentUserId = useCallback(
    (id: number) => {
      const user = users.find((u) => u.id === id);
      if (!user) return;
      setStoredUserId(user.id);
      setCurrentUser(user);
    },
    [users],
  );

  const value = useMemo(
    () => ({ users, currentUser, loading, error, setCurrentUserId, refreshUsers }),
    [users, currentUser, loading, error, setCurrentUserId, refreshUsers],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider");
  return ctx;
}
