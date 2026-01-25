// src/hooks/useUsers.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: "consumer" | "business" | "influencer";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  lastLoginAt: string | null;
  createdAt: string;
  businessName: string | null;
};

type PaginatedResponse = {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function useUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  userType?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.userType) queryParams.append('type', params.userType);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    fetchWithAuth<PaginatedResponse>(
      `/admin/users?${queryParams.toString()}`,
      token
    )
      .then((response) => {
        setUsers(response.data);
        setPagination(response.pagination);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [token, JSON.stringify(params)]); // Stringify params for deep comparison

  return { users, pagination, loading, error };
}

export function useRecentUsers(limit = 5) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetchWithAuth<User[]>(`/admin/users/recent?limit=${limit}`, token)
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [token, limit]);

  console.log("Recent users: ", users);

  return { users, loading, error };
}