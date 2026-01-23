import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Key, UserX, UserCheck, CreditCard, Building2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserTypeBadge } from '@/components/admin/UserTypeBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { mockUsers, mockPayments } from '@/data/mockData';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === userId);

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCancelSubDialog, setShowCancelSubDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">User not found</h2>
            <p className="text-muted-foreground">The requested user does not exist.</p>
            <Button className="mt-4" onClick={() => navigate('/admin/users')}>
              Back to Users
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const userPayments = mockPayments.filter((p) => p.userId === user.id);

  const handleResetPassword = () => {
    toast.success('Password reset email sent to ' + user.email);
  };

  const handleChangeEmail = () => {
    if (newEmail) {
      toast.success('Email changed from ' + user.email + ' to ' + newEmail);
      setShowEmailDialog(false);
      setNewEmail('');
    }
  };

  const handleChangePhone = () => {
    if (newPhone) {
      toast.success('Phone changed from ' + user.phone + ' to ' + newPhone);
      setShowPhoneDialog(false);
      setNewPhone('');
    }
  };

  const handleToggleStatus = () => {
    const action = user.status === 'active' ? 'disabled' : 'enabled';
    toast.success(`Account ${action} for ${user.name}`);
    setShowStatusDialog(false);
  };

  const handleCancelSubscription = () => {
    toast.success('Subscription cancelled for ' + user.businessName);
    setShowCancelSubDialog(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <UserTypeBadge type={user.type} />
              <StatusBadge status={user.status} />
            </div>
            <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info */}
          <div className="admin-card lg:col-span-2">
            <h2 className="text-lg font-semibold">User Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm')
                      : 'Never'}
                  </p>
                </div>
              </div>
              {user.businessName && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 sm:col-span-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Name</p>
                    <p className="font-medium">{user.businessName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="admin-card">
            <h2 className="text-lg font-semibold">Admin Actions</h2>
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleResetPassword}
              >
                <Key className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setNewEmail(user.email);
                  setShowEmailDialog(true);
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Change Email
              </Button>
              {(user.type === 'business' || user.type === 'consumer') && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewPhone(user.phone);
                    setShowPhoneDialog(true);
                  }}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Change Phone
                </Button>
              )}
              <Button
                variant={user.status === 'active' ? 'destructive' : 'default'}
                className="w-full justify-start"
                onClick={() => setShowStatusDialog(true)}
              >
                {user.status === 'active' ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Disable Account
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Enable Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Subscription (Business only) */}
        {user.type === 'business' && user.subscription && (
          <div className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Subscription</h2>
                <p className="text-sm text-muted-foreground">Current subscription plan and status</p>
              </div>
              {user.subscription.status === 'active' && (
                <Button variant="destructive" onClick={() => setShowCancelSubDialog(true)}>
                  Cancel Subscription
                </Button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-semibold">{user.subscription.plan}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={user.subscription.status} />
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">{user.subscription.startDate}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Stripe ID</p>
                <p className="font-mono text-xs">{user.subscription.stripeSubscriptionId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payments */}
        <div className="admin-card">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Payment History</h2>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="admin-table">
              <thead className="bg-muted/50">
                <tr>
                  <th>Stripe ID</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {userPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No payment history
                    </td>
                  </tr>
                ) : (
                  userPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-mono text-xs">{payment.stripePaymentId}</td>
                      <td>{payment.description}</td>
                      <td className="font-medium">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td>
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="text-muted-foreground">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Update the email address for {user.name}. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email">New Email Address</Label>
            <Input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeEmail}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Phone Number</DialogTitle>
            <DialogDescription>
              Update the phone number for {user.name}. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="phone">New Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePhone}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Confirmation */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.status === 'active' ? 'Disable Account' : 'Enable Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.status === 'active'
                ? `Are you sure you want to disable the account for ${user.name}? They will no longer be able to log in.`
                : `Are you sure you want to enable the account for ${user.name}? They will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {user.status === 'active' ? 'Disable' : 'Enable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation */}
      <AlertDialog open={showCancelSubDialog} onOpenChange={setShowCancelSubDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the subscription for {user.businessName}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
