import { useState, useRef } from 'react';
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
import { toast } from 'sonner';
import { updateAuthProfile } from '@/actions/auth';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import type { UserResource } from '@clerk/tanstack-react-start/types';

interface AccountSettingsProps {
  user: Doc<'users'>;
  clerkUser: UserResource | null;
  authName: string;
}

export function AccountSettings({
  user,
  clerkUser,
  authName,
}: AccountSettingsProps) {
  // Profile state
  const [displayName, setDisplayName] = useState(authName);
  const [profileLoading, setProfileLoading] = useState(false);
  const updateConvexProfile = useMutation(api.user.updateUserProfile);

  // Email state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const pendingEmailRef = useRef<{
    emailAddressId: string;
    oldPrimaryId: string | null;
  } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const hasPassword = clerkUser?.passwordEnabled ?? false;
  const authEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? '';

  // ---------------------------------------------------------------------------
  // Fix 4: Resilient dual-write for display name
  // ---------------------------------------------------------------------------
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setProfileLoading(true);

    const trimmed = displayName.trim();
    let clerkOk = false;
    let convexOk = false;

    try {
      await updateAuthProfile({ data: { name: trimmed } });
      clerkOk = true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    }

    try {
      await updateConvexProfile({ displayName: trimmed });
      convexOk = true;
    } catch {
      if (clerkOk) {
        toast.error('Name updated in auth but failed to sync. Please retry.');
      }
    }

    if (clerkOk && convexOk) {
      toast.success('Profile updated');
    }

    setProfileLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Fix 2: Complete email change via Clerk frontend SDK
  // ---------------------------------------------------------------------------
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser) {
      toast.error('User session not available');
      return;
    }
    if (!newEmail.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    setEmailLoading(true);
    try {
      // Step 1: Create the new email address on the Clerk user
      const emailAddress = await clerkUser.createEmailAddress({
        email: newEmail.trim(),
      });

      // Step 2: Send a verification code
      await emailAddress.prepareVerification({ strategy: 'email_code' });

      // Store reference for the verification step
      pendingEmailRef.current = {
        emailAddressId: emailAddress.id,
        oldPrimaryId: clerkUser.primaryEmailAddressId,
      };

      setVerificationStep(true);
      toast.success('Verification code sent to your new email address');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send verification code'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser || !pendingEmailRef.current) {
      toast.error('No pending email verification');
      return;
    }
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }
    setEmailLoading(true);
    try {
      // Find the email address resource on the user
      const emailAddress = clerkUser.emailAddresses.find(
        (ea) => ea.id === pendingEmailRef.current!.emailAddressId
      );
      if (!emailAddress) {
        throw new Error('Email address not found. Please start over.');
      }

      // Step 3: Verify the code
      await emailAddress.attemptVerification({
        code: verificationCode.trim(),
      });

      // Step 4: Promote to primary
      await clerkUser.update({
        primaryEmailAddressId: emailAddress.id,
      });

      // Step 5: Optionally remove the old primary email
      if (pendingEmailRef.current.oldPrimaryId) {
        const oldEmail = clerkUser.emailAddresses.find(
          (ea) => ea.id === pendingEmailRef.current!.oldPrimaryId
        );
        if (oldEmail) {
          await oldEmail.destroy();
        }
      }

      toast.success('Email address updated successfully');

      // Reset state
      setVerificationStep(false);
      setVerificationCode('');
      setNewEmail('');
      pendingEmailRef.current = null;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancelVerification = () => {
    setVerificationStep(false);
    setVerificationCode('');
    pendingEmailRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // Fix 3: Password change with OAuth guard + set-initial-password support
  // ---------------------------------------------------------------------------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser) {
      toast.error('User session not available');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await clerkUser.updatePassword({
        newPassword,
        // Only include currentPassword when the user already has one
        ...(hasPassword && { currentPassword }),
      });
      toast.success(hasPassword ? 'Password updated' : 'Password set');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your display name and profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            {verificationStep ? (
              'Enter the verification code sent to your new email address.'
            ) : (
              <>
                Your current email is <strong>{authEmail}</strong>. A
                verification code will be sent to your new address.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStep ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter code"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? 'Verifying...' : 'Verify & Update Email'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelVerification}
                  disabled={emailLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                />
              </div>
              <Button type="submit" disabled={emailLoading}>
                {emailLoading ? 'Sending...' : 'Change Email'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {hasPassword
              ? 'Change your password. Must be at least 8 characters.'
              : 'Your account uses social login. Set a password to also sign in with email and password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {hasPassword ? 'New Password' : 'Password'}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {hasPassword ? 'Confirm New Password' : 'Confirm Password'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading
                ? 'Updating...'
                : hasPassword
                  ? 'Change Password'
                  : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
