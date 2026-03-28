import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { Monitor, Moon, Sun } from 'lucide-react';

interface AppearanceSettingsProps {
  user: Doc<'users'>;
}

const themes = [
  {
    value: 'light' as const,
    label: 'Light',
    description: 'Light background with dark text',
    icon: Sun,
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    description: 'Dark background with light text',
    icon: Moon,
  },
  {
    value: 'system' as const,
    label: 'System',
    description: 'Follows your operating system setting',
    icon: Monitor,
  },
];

export function AppearanceSettings({ user }: AppearanceSettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    user.theme ?? 'system'
  );
  const updatePreferences = useMutation(api.user.updateUserPreferences);

  const handleThemeChange = async (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    try {
      await updatePreferences({ userId: user._id, theme: value });

      // Apply theme to document
      const root = document.documentElement;
      if (value === 'system') {
        const systemDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        root.classList.toggle('dark', systemDark);
      } else {
        root.classList.toggle('dark', value === 'dark');
      }

      toast.success(`Theme set to ${value}`);
    } catch {
      toast.error('Failed to update theme');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how MoodSync looks to you. Select a theme preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <Label
                  key={t.value}
                  htmlFor={`theme-${t.value}`}
                  className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors hover:bg-accent ${
                    theme === t.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent'
                  }`}
                >
                  <RadioGroupItem
                    value={t.value}
                    id={`theme-${t.value}`}
                    className="sr-only"
                  />
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.description}
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
