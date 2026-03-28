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
        notificationPrefs: { emailDigest: value, moodReminders },
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
        notificationPrefs: { emailDigest, moodReminders: checked },
      });
      toast.success(
        checked ? 'Mood reminders enabled' : 'Mood reminders disabled'
      );
    } catch {
      toast.error('Failed to update preference');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Digest</CardTitle>
          <CardDescription>
            Receive a summary of your mood patterns and insights via email.
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
            <Select value={emailDigest} onValueChange={handleDigestChange}>
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
          <CardTitle>Mood Reminders</CardTitle>
          <CardDescription>
            Get a daily reminder to log your mood.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mood-reminders">Daily Mood Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Receive a notification to log your mood each day.
              </p>
            </div>
            <Switch
              id="mood-reminders"
              checked={moodReminders}
              onCheckedChange={handleRemindersChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
