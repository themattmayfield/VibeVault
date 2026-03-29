import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { useSignUp } from '@clerk/tanstack-react-start';

type SignUpResource = NonNullable<ReturnType<typeof useSignUp>['signUp']>;

interface EmailVerificationStepProps {
  signUp: SignUpResource;
  email: string;
  onVerified: () => void | Promise<void>;
}

export function EmailVerificationStep({
  signUp,
  email,
  onVerified,
}: EmailVerificationStepProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) throw new Error(error.message ?? 'Verification failed');

      if (signUp.status === 'complete') {
        await signUp.finalize();
        await onVerified();
      } else {
        toast.error('Verification incomplete', {
          description: `Unexpected status: ${signUp.status}. Please try again.`,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid verification code';
      toast.error('Verification failed', { description: message });
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) throw new Error(error.message ?? 'Failed to resend code');

      toast.success('Verification code resent', {
        description: `A new code has been sent to ${email}`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to resend code';
      toast.error('Could not resend code', { description: message });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We sent a verification code to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify email'
            )}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Didn't receive a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              {isResending ? 'Resending...' : 'Resend code'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
