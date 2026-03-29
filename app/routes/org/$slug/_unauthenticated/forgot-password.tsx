import { createFileRoute, Link } from '@tanstack/react-router';
import { GalleryVerticalEnd, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useState } from 'react';
import { APP_INFO } from '@/constants/app-info';
import { useSignIn } from '@clerk/tanstack-react-start';
import { toast } from 'sonner';
import { useSubmittingDots } from '@/hooks/useSubmittingDots';

export const Route = createFileRoute(
  '/org/$slug/_unauthenticated/forgot-password'
)({
  component: ForgotPassword,
});

type Step = 'email' | 'code' | 'new-password';

function ForgotPassword() {
  const { slug } = Route.useParams();
  const { signIn } = useSignIn();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const dots = useSubmittingDots(isSubmitting);

  /** Step 1: Create sign-in with identifier, then send reset code */
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signIn || !email) return;

    setIsSubmitting(true);
    try {
      // Create the sign-in attempt with the user's email
      const createResult = await signIn.create({ identifier: email });
      if (createResult.error) {
        throw new Error(
          createResult.error.message ??
            'Could not find an account with that email'
        );
      }

      // Send the reset password email code
      const sendResult = await signIn.resetPasswordEmailCode.sendCode();
      if (sendResult.error) {
        throw new Error(
          sendResult.error.message ?? 'Failed to send reset code'
        );
      }

      setStep('code');
      toast.success('Reset code sent', {
        description: `Check your email at ${email}`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send reset code';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Step 2: Verify the code */
  const handleVerifyCode = async () => {
    if (!signIn || code.length !== 6) return;

    setIsSubmitting(true);
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (result.error) {
        throw new Error(result.error.message ?? 'Invalid verification code');
      }

      if (signIn.status === 'needs_new_password') {
        setStep('new-password');
      } else {
        throw new Error('Unexpected verification status. Please try again.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid verification code';
      toast.error('Verification failed', { description: message });
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Resend the reset code */
  const handleResendCode = async () => {
    if (!signIn) return;

    setIsResending(true);
    try {
      const result = await signIn.resetPasswordEmailCode.sendCode();
      if (result.error) {
        throw new Error(result.error.message ?? 'Failed to resend code');
      }

      toast.success('Code resent', {
        description: `A new code has been sent to ${email}`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to resend code';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  /** Step 3: Set new password */
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signIn) return;

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      if (result.error) {
        throw new Error(result.error.message ?? 'Failed to reset password');
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        toast.success('Password reset successfully');
        window.location.href = `/org/${slug}/sign-in`;
      } else {
        throw new Error('Password reset could not be completed.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="##"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {APP_INFO.name}
        </a>
        <div className="flex flex-col gap-6">
          {/* Step 1: Enter email */}
          {step === 'email' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email to receive a reset code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendCode}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? `Sending code${dots}` : 'Send reset code'}
                    </Button>
                    <div className="text-center text-sm">
                      Remember your password?{' '}
                      <Link
                        to="/org/$slug/sign-in"
                        params={{ slug }}
                        className="underline underline-offset-4"
                      >
                        Login
                      </Link>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Enter verification code */}
          {step === 'code' && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                  We sent a reset code to{' '}
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
                      onComplete={handleVerifyCode}
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
                    onClick={handleVerifyCode}
                    disabled={code.length !== 6 || isSubmitting}
                    className="w-full cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify code'
                    )}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Didn't receive a code?{' '}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="underline underline-offset-4 hover:text-foreground disabled:opacity-50 cursor-pointer"
                    >
                      {isResending ? 'Resending...' : 'Resend code'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                    }}
                    className="flex items-center gap-1 self-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Use a different email
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Set new password */}
          {step === 'new-password' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Set new password</CardTitle>
                <CardDescription>
                  Choose a new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      {newPassword && newPassword.length < 8 && (
                        <p className="text-xs text-red-500">
                          Must be at least 8 characters
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">
                        Confirm new password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? `Resetting password${dots}`
                        : 'Reset password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
