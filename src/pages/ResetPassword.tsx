import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPassword } from '@/services/api';
import { validatePassword } from '@/lib/passwordPolicy';

type ResetStatus = 'idle' | 'form' | 'submitting' | 'success' | 'error';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ResetStatus>('idle');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing reset token. Please request a new password reset.');
      return;
    }
    setStatus('form');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMessage('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setMessage(passwordCheck.message);
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      await resetPassword(token!, password);
      setStatus('success');
      setMessage('Your password has been reset. You can now log in with your new password.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Password reset failed.';
      setStatus('error');
      setMessage(detail);
    }
  };

  return (
    <Layout>
      <SEO title="Reset Password" description="Reset your account password" />
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-8 space-y-4">
          {status === 'idle' && (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <h1 className="text-2xl font-semibold text-foreground text-center">Reset Failed</h1>
              <p className="text-sm text-muted-foreground text-center">{message}</p>
              <div className="pt-2 text-center">
                <Button asChild>
                  <Link to="/account">Go to Account</Link>
                </Button>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-10 w-10 text-accent mx-auto" />
              <h1 className="text-2xl font-semibold text-foreground text-center">Password Reset</h1>
              <p className="text-sm text-muted-foreground text-center">{message}</p>
              <div className="pt-2 text-center">
                <Button onClick={() => navigate('/account')}>Log In</Button>
              </div>
            </>
          )}

          {(status === 'form' || status === 'submitting') && (
            <>
              <KeyRound className="h-10 w-10 text-accent mx-auto" />
              <h1 className="text-2xl font-semibold text-foreground text-center">Set New Password</h1>
              <p className="text-sm text-muted-foreground text-center">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-foreground mb-1 block">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'submitting'}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground mb-1 block">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === 'submitting'}
                  />
                </div>

                {message && (
                  <p className="text-sm text-destructive">{message}</p>
                )}

                <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
