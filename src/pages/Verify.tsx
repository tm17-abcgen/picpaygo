import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, MailCheck, MailX } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/services/api';

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    setStatus('verifying');
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. Redirecting...');
        // Full page refresh to pick up session cookie
        setTimeout(() => {
          window.location.href = '/account';
        }, 1500);
      })
      .catch((error) => {
        const detail = error instanceof Error ? error.message : 'Verification failed.';
        setStatus('error');
        setMessage(detail);
      });
  }, [searchParams]);

  return (
    <Layout>
      <SEO title="Verify Email" description="Verify your PicPayGo account email" />
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-8 space-y-4">
          {status === 'verifying' && (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          )}
          {status === 'success' && (
            <MailCheck className="h-10 w-10 text-accent mx-auto" />
          )}
          {status === 'error' && (
            <MailX className="h-10 w-10 text-destructive mx-auto" />
          )}

          <h1 className="text-2xl font-semibold text-foreground">Email Verification</h1>
          <p className="text-sm text-muted-foreground">{message}</p>

          <div className="pt-2">
            <Button onClick={() => window.location.href = '/account'}>
              Go to Account
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
