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
import { Badge } from '@/components/ui/badge';
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
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { useParams } from '@tanstack/react-router';
import { Download, Trash2, Lock } from 'lucide-react';
import { useOrgSettings } from '@/hooks/use-org-settings';
import {
  getAvailableExportFormats,
  canExportAs,
  type ExportFormat,
} from '@/lib/plan-features';

interface DataPrivacySettingsProps {
  user: Doc<'users'>;
}

function escapeCSV(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildMoodsCsv(
  moods: Array<{
    mood: string;
    note?: string;
    tags?: string[];
    context?: {
      sleepQuality?: string;
      exercise?: boolean;
      socialInteraction?: string;
      workload?: string;
      weather?: string;
    };
    time: number;
  }>
): string {
  const headers = [
    'date',
    'mood',
    'note',
    'tags',
    'sleep',
    'exercise',
    'social',
    'workload',
    'weather',
  ];
  const rows = moods.map((m) => [
    new Date(m.time).toISOString(),
    m.mood,
    m.note ?? '',
    m.tags?.join('; ') ?? '',
    m.context?.sleepQuality ?? '',
    m.context?.exercise !== undefined ? String(m.context.exercise) : '',
    m.context?.socialInteraction ?? '',
    m.context?.workload ?? '',
    m.context?.weather ?? '',
  ]);
  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}

function buildJournalsCsv(
  journals: Array<{
    title: string;
    content: string;
    mood?: string;
    tags?: string[];
    time: number;
  }>
): string {
  const headers = ['date', 'title', 'mood', 'tags', 'content'];
  const rows = journals.map((j) => [
    new Date(j.time).toISOString(),
    j.title,
    j.mood ?? '',
    j.tags?.join('; ') ?? '',
    j.content,
  ]);
  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}

function buildGoalsCsv(
  goals: Array<{
    title: string;
    type: string;
    status: string;
    timeframe: string;
    time: number;
  }>
): string {
  const headers = ['date', 'title', 'type', 'status', 'timeframe'];
  const rows = goals.map((g) => [
    new Date(g.time).toISOString(),
    g.title,
    g.type,
    g.status,
    g.timeframe,
  ]);
  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}

export function DataPrivacySettings({ user }: DataPrivacySettingsProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportLoading, setExportLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';

  const availableFormats = getAvailableExportFormats(orgSettings.plan);
  const hasExport = availableFormats.length > 0;

  // Default to the best available format
  const effectiveFormat =
    availableFormats.includes(exportFormat) && hasExport
      ? exportFormat
      : (availableFormats[availableFormats.length - 1] ?? 'csv');

  const exportData = useQuery(
    api.user.exportUserData,
    hasExport ? { userId: user._id, organizationId } : 'skip'
  );
  const deleteUserData = useMutation(api.user.deleteUserData);

  const handleExport = async () => {
    if (!exportData) {
      toast.error('No data available to export');
      return;
    }
    if (!canExportAs(orgSettings.plan, effectiveFormat)) {
      toast.error(
        'Your plan does not include this export format. Please upgrade.'
      );
      return;
    }
    setExportLoading(true);
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      if (effectiveFormat === 'json') {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // CSV: export multiple sheets as separate sections
        const sections = [
          '# Moods',
          buildMoodsCsv(exportData.moods),
          '',
          '# Journals',
          buildJournalsCsv(exportData.journals),
          '',
          '# Goals',
          buildGoalsCsv(exportData.goals),
        ];
        content = sections.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentio-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
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
      toast.success('Account deleted');
      // Clerk session is invalidated when user is deleted -- reload to clear
      window.location.href = slug ? `/org/${slug}/sign-in` : '/';
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
            Download your mood entries, journal reflections, goals,
            achievements, and insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasExport ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Data export requires a Pro plan or higher
                </p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to Pro for CSV export, Team for JSON, or Enterprise
                  for API access.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={effectiveFormat}
                    onValueChange={(v) => setExportFormat(v as ExportFormat)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats
                        .filter((f) => f !== 'api')
                        .map((f) => (
                          <SelectItem key={f} value={f}>
                            {f.toUpperCase()}
                          </SelectItem>
                        ))}
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

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Available formats:</span>
                {availableFormats.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs">
                    {f.toUpperCase()}
                  </Badge>
                ))}
              </div>

              {canExportAs(orgSettings.plan, 'api') && (
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium">API Access</p>
                  <p className="text-xs text-muted-foreground">
                    Your Enterprise plan includes programmatic API access for
                    automated data export and integrations. Contact our team to
                    set up API keys and configure your integration.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="mailto:support@sentio.sh?subject=Enterprise API Access">
                      Contact Sales
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}
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
