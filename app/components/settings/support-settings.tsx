import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  BookOpen,
  HelpCircle,
  Users,
  Activity,
  Lightbulb,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { getPlanFeatures, type PlanTier } from '@/lib/plan-features';
import type { Doc } from 'convex/_generated/dataModel';

interface SupportSettingsProps {
  user: Doc<'users'>;
  orgSettings?: Doc<'orgSettings'>;
  orgSlug?: string;
  showResources?: boolean;
}

const SUPPORT_EMAIL = 'support@sentio.sh';

type SupportCategory = 'bug' | 'feature' | 'billing' | 'account' | 'other';

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  billing: 'Billing Question',
  account: 'Account Issue',
  other: 'Other',
};

const SUPPORT_TIER_CONFIG: Record<
  'community' | 'email' | 'priority' | 'dedicated',
  {
    label: string;
    badge: string;
    description: string;
    responseTime?: string;
  }
> = {
  community: {
    label: 'Community Support',
    badge: 'Community',
    description:
      'Access our documentation, FAQ, and community resources for help.',
  },
  email: {
    label: 'Email Support',
    badge: 'Email',
    description: 'Send us a message and our support team will get back to you.',
    responseTime: 'We typically respond within 24 hours.',
  },
  priority: {
    label: 'Priority Support',
    badge: 'Priority',
    description: 'Get faster responses from our dedicated support team.',
    responseTime: 'We aim to respond within 4 hours during business hours.',
  },
  dedicated: {
    label: 'Dedicated Support',
    badge: 'Dedicated',
    description: 'Your dedicated account representative will respond promptly.',
    responseTime:
      'Your account rep will respond within 1 hour during business hours.',
  },
};

const RESOURCE_LINKS = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Guides, tutorials, and API reference.',
    href: 'https://docs.sentio.sh',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Frequently asked questions and troubleshooting.',
    href: 'https://help.sentio.sh',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join the discussion and connect with other users.',
    href: 'https://community.sentio.sh',
  },
  {
    icon: Activity,
    title: 'Status Page',
    description: 'Check service status and incident history.',
    href: 'https://status.sentio.sh',
  },
  {
    icon: Lightbulb,
    title: 'Feature Requests',
    description: 'Vote on upcoming features or suggest new ones.',
    href: 'https://feedback.sentio.sh',
  },
];

function buildMailtoUrl({
  category,
  subject,
  message,
  plan,
  orgSlug,
  userEmail,
}: {
  category: SupportCategory;
  subject: string;
  message: string;
  plan: string;
  orgSlug?: string;
  userEmail?: string;
}) {
  const prefix = `[${CATEGORY_LABELS[category]}]`;
  const fullSubject = subject ? `${prefix} ${subject}` : prefix;
  const footer = [
    '',
    '---',
    `Plan: ${plan}`,
    orgSlug ? `Org: ${orgSlug}` : null,
    userEmail ? `User: ${userEmail}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const fullBody = message ? `${message}\n${footer}` : footer;

  const params = new URLSearchParams();
  params.set('subject', fullSubject);
  params.set('body', fullBody);

  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

export function SupportSettings({
  user,
  orgSettings,
  orgSlug,
  showResources = false,
}: SupportSettingsProps) {
  const [category, setCategory] = useState<SupportCategory>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const currentPlan = (orgSettings?.plan ?? user.plan ?? 'free') as PlanTier;
  const features = getPlanFeatures(currentPlan);
  const supportTier = features.support;
  const tierConfig = SUPPORT_TIER_CONFIG[supportTier];
  const hasContactForm = supportTier !== 'community';

  const handleSendEmail = () => {
    const url = buildMailtoUrl({
      category,
      subject,
      message,
      plan: features.label,
      orgSlug,
      userEmail: user.email,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Support Tier Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Support Plan</CardTitle>
              <CardDescription>
                Based on your current {features.label} plan.
              </CardDescription>
            </div>
            <Badge
              variant={supportTier === 'community' ? 'secondary' : 'default'}
              className="text-sm px-3 py-1"
            >
              {tierConfig.badge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tierConfig.description}
          </p>
          {tierConfig.responseTime && (
            <p className="text-sm font-medium">{tierConfig.responseTime}</p>
          )}
          {supportTier === 'community' && (
            <div className="rounded-lg border border-dashed p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Want faster, direct support?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to Pro or above for email support with guaranteed
                  response times.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Support Card (hidden for community tier) */}
      {hasContactForm && (
        <>
          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Contact Support</CardTitle>
              </div>
              <CardDescription>{tierConfig.responseTime}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as SupportCategory)}
                >
                  <SelectTrigger id="support-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as SupportCategory[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {CATEGORY_LABELS[key]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-subject">Subject</Label>
                <Input
                  id="support-subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-message">Message</Label>
                <Textarea
                  id="support-message"
                  placeholder="Describe your issue or question in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  This will open your email client with the details pre-filled.
                </p>
                <Button onClick={handleSendEmail}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Resources Card (feature-flagged) */}
      {showResources && (
        <>
          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                Find answers and connect with the community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {RESOURCE_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.title}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 group"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{link.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
