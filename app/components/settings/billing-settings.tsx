import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerPortalUrl } from '@/actions/polar';

export function BillingSettings() {
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    try {
      const url = await getCustomerPortalUrl();
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error(
          'No billing account found. You may not have an active subscription.'
        );
      }
    } catch {
      toast.error('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>
            Manage your subscription, view invoices, and update payment methods
            through the billing portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenPortal} disabled={loading}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {loading ? 'Opening...' : 'Open Billing Portal'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
