import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteAccount } from '@/actions/auth';
import { signOutAction } from '@/actions/auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';
import { Download, Trash2 } from 'lucide-react';

interface DataPrivacySettingsProps {
  user: Doc<'users'>;
}

export function DataPrivacySettings({ user }: DataPrivacySettingsProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportLoading, setExportLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  const exportData = useQuery(api.user.exportUserData, { userId: user._id });
  const deleteUserData = useMutation(api.user.deleteUserData);

  const handleExport = async () => {
    if (!exportData) {
      toast.error('No data available to export');
      return;
    }
    setExportLoading(true);
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      if (exportFormat === 'json') {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // Convert to CSV
        const rows = exportData.moods.map((mood) => ({
          date: new Date(mood.time).toISOString(),
          mood: mood.mood,
          note: mood.note ?? '',
          tags: mood.tags?.join('; ') ?? '',
        }));
        const headers = ['date', 'mood', 'note', 'tags'];
        const csvRows = [
          headers.join(','),
          ...rows.map((row) =>
            headers
              .map((h) => {
                const val = row[h as keyof typeof row];
                return `"${String(val).replace(/"/g, '""')}"`;
              })
              .join(',')
          ),
        ];
        content = csvRows.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moodsync-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password is required to delete your account');
      return;
    }
    setDeleteLoading(true);
    try {
      // Delete Convex data first
      await deleteUserData({ userId: user._id });
      // Then delete auth account
      await deleteAccount({ data: { password: deletePassword } });
      await signOutAction();
      toast.success('Account deleted');
      router.navigate({ to: '/tenant/sign-in', reloadDocument: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete account'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download all your mood entries, insights, and profile data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(v) => setExportFormat(v as 'json' | 'csv')}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleExport}
              disabled={exportLoading || !exportData}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportLoading ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Delete Account */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all mood entries,
                  insights, and group memberships. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="delete-password">
                  Enter your password to confirm
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deletePassword}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
