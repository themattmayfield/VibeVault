import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { Mail, Bell, Info } from 'lucide-react';

interface NotificationSettingsProps {
  user: Doc<'users'>;
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const prefs = user.notificationPrefs;
  const [emailDigest, setEmailDigest] = useState<'daily' | 'weekly' | 'never'>(
    prefs?.emailDigest ?? 'never'
  );
  const [moodReminders, setMoodReminders] = useState(
    prefs?.moodReminders ?? false
  );
  const updatePreferences = useMutation(api.user.updateUserPreferences);

  const handleDigestChange = async (value: 'daily' | 'weekly' | 'never') => {
    setEmailDigest(value);
    try {
      await updatePreferences({
        userId: user._id,
        notificationPrefs: {
          ...prefs,
          emailDigest: value,
        },
      });
      toast.success('Email digest preference updated');
    } catch {
      toast.error('Failed to update preference');
    }
  };

  const handleRemindersChange = async (checked: boolean) => {
    setMoodReminders(checked);
    try {
      await updatePreferences({
        userId: user._id,
        notificationPrefs: {
          ...prefs,
          moodReminders: checked,
        },
      });
      toast.success(
        checked ? 'Mood reminders enabled' : 'Mood reminders disabled'
      );
    } catch {
      toast.error('Failed to update preference');
    }
  };

  const hasEmail = !!user.email;

  return (
    <div className="space-y-6">
      {!hasEmail && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="flex items-start gap-3 pt-6">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Email address required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                We need your email address to send notifications. Your email
                will be synced from your account the next time you sign in.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Email Digest</CardTitle>
          </div>
          <CardDescription>
            Receive a summary of your mood patterns and insights via email.
            {hasEmail && (
              <span className="block mt-1 text-xs">
                Sent to <span className="font-medium">{user.email}</span>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Digest Frequency</Label>
              <p className="text-sm text-muted-foreground">
                How often would you like to receive mood summaries?
              </p>
            </div>
            <Select
              value={emailDigest}
              onValueChange={handleDigestChange}
              disabled={!hasEmail}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Mood Reminders</CardTitle>
          </div>
          <CardDescription>
            Get a daily email reminder to log your mood. We'll skip the reminder
            if you've already logged for the day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mood-reminders">Daily Mood Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Receive an email each day to log your mood.
              </p>
            </div>
            <Switch
              id="mood-reminders"
              checked={moodReminders}
              onCheckedChange={handleRemindersChange}
              disabled={!hasEmail}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
