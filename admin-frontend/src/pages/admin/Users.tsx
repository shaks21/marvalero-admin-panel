import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Eye, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { UserTypeBadge } from "@/components/admin/UserTypeBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { formatDistanceToNow } from "date-fns";
import { mapUserStatus } from "@/lib/utils";

// Sorting types
type SortField = 'name' | 'email' | 'type' | 'status' | 'lastLogin' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Users() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "consumer" | "business" | "influencer"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ACTIVE" | "DISABLED"
  >("all");
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch ALL users once (client-side filtering)
  const { users: allUsers, loading, error } = useUsers();

  // Client-side filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];

    let filtered = [...allUsers];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((user) => {
        return (
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower) ||
          user.businessName?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((user) => user.userType.toLowerCase() === typeFilter.toLowerCase());
    }

    // Apply status filter
    if (statusFilter !== "all") {
      console.log("Applying status filter:", statusFilter);
      console.log("user.status values:", filtered.map(u => u.status));
      filtered = filtered.filter((user) => mapUserStatus(user.status).toLowerCase() === statusFilter.toLowerCase());
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.userType;
          bValue = b.userType;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'lastLogin':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }

      // Handle number/date comparison
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [allUsers, search, typeFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalUsers = filteredAndSortedUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, page, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const SortableHeader = ({ 
    field, 
    children 
  }: { 
    field: SortField; 
    children: React.ReactNode;
  }) => {
    const isActive = sortField === field;
    return (
      <th 
        className="cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-50" />
          )}
        </div>
      </th>
    );
  };

  console.log("Users page render:", {
    search,
    typeFilter,
    statusFilter,
    sortField,
    sortDirection,
    page,
    itemsPerPage,
    totalUsers,
    filteredUsers: filteredAndSortedUsers.length,
    paginatedUsers: paginatedUsers.length,
    loading,
    error,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and manage platform users
          </p>
        </div>

        {/* Filters */}
        <div className="admin-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, phone, or business name..."
              className="flex-1"
            />

            <div className="flex gap-3">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as any)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="consumer">Consumer</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as any)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Results info */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
            {filteredAndSortedUsers.length < allUsers.length && ` (filtered from ${allUsers.length} total)`}
          </div>
        </div>

        {/* Results Table */}
        <div className="admin-card p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="admin-table">
              <thead className="bg-muted/50">
                <tr>
                  <SortableHeader field="name">
                    User
                  </SortableHeader>
                  <SortableHeader field="type">
                    Type
                  </SortableHeader>
                  <SortableHeader field="status">
                    Status
                  </SortableHeader>
                  <SortableHeader field="lastLogin">
                    Last Login
                  </SortableHeader>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {search || typeFilter !== "all" || statusFilter !== "all"
                        ? "No users found matching your filters"
                        : "No users found"}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          {user.businessName && (
                            <p className="text-xs text-muted-foreground">
                              {user.businessName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <UserTypeBadge type={user.userType} />
                      </td>
                      <td>
                        <StatusBadge status={mapUserStatus(user.status)} />
                      </td>
                      <td className="text-muted-foreground">
                        {user.lastLoginAt
                          ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                          : "Never"}
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/users/${user.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="border-t p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {totalUsers} total users
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}