import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
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
import { formatDistanceToNow, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { mapUserStatus } from "@/lib/utils";

export default function Users() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "consumer" | "business" | "influencer"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ACTIVE" | "SUSPENDED" | "BANNED"
  >("all");
  const [page, setPage] = useState(1);

  const { users, pagination, loading, error } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    userType: typeFilter !== "all" ? typeFilter : undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  console.log("Users page render:", {
    search,
    typeFilter,
    statusFilter,
    page,
    users,
    pagination,
    loading,
    error,
  }
  )

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
              onChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              placeholder="Search by name, email, phone, or business name..."
              className="flex-1"
            />

            <div className="flex gap-3">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setTypeFilter(value as any);
                }}
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
                onValueChange={(value) => {
                  setPage(1);
                  setStatusFilter(value as any);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="BANNED">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="admin-card p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="admin-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Login</th>
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
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
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
                          ? formatDistanceToNow(
                              toZonedTime(user.lastLoginAt, "UTC"), // Convert UTC to local time
                              { addSuffix: true },
                            )
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
            <p className="text-sm text-muted-foreground">
              Showing {users.length} of {pagination.total} users
            </p>

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
                disabled={page >= pagination.totalPages}
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
