import { useState, useEffect, useRef } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/context/CreditsContext';
import { useToast } from '@/hooks/use-toast';

interface LoginPromptProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: { theme?: string; size?: string; width?: number; text?: string; type?: string }) => void;
        };
      };
    };
  }
}

export function LoginPrompt({ onSuccess }: LoginPromptProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, register } = useCredits();
  const { toast } = useToast();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const handleGoogleSignIn = async (credential: string) => {
      setGoogleLoading(true);
      try {
        await loginWithGoogle(credential);
        toast({
          title: 'Welcome!',
          description: 'You are now logged in with Google.',
        });
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Google login failed. Please try again.';
        toast({
          title: 'Google login failed',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setGoogleLoading(false);
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        // Clear any existing button
        googleButtonRef.current.innerHTML = '';
        
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            handleGoogleSignIn(response.credential);
          },
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
          type: 'standard',
        });
      }
    };

    // Wait for Google script to load
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id && googleButtonRef.current) {
          clearInterval(checkGoogle);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }

    return () => {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
    };
  }, [GOOGLE_CLIENT_ID, loginWithGoogle, toast, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast({
          title: 'Welcome back!',
          description: 'You are now logged in.',
        });
        onSuccess?.();
      } else {
        const result = await register(email, password);
        toast({
          title: 'Check your email',
          description: result.verificationRequired
            ? 'We sent a verification link. Verify your email, then log in.'
            : 'Account created. Please log in.',
        });
        setMode('login');
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Please check your credentials and try again.';
      toast({
        title: mode === 'login' ? 'Login failed' : 'Registration failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
      <div className="flex items-center justify-between gap-4 mb-4 text-muted-foreground">
        <div className="flex items-center gap-2">
        <LogIn className="h-4 w-4 text-accent" />
          <span className="text-[11px] uppercase tracking-[0.3em]">
            {mode === 'login' ? 'Login to continue' : 'Create an account'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/80 hover:text-foreground"
        >
          {mode === 'login' ? 'Register' : 'Login'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || googleLoading}
          aria-label="Email address"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading || googleLoading}
          aria-label="Password"
        />
        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'login' ? 'Logging in...' : 'Creating account...'}
            </>
          ) : (
            mode === 'login' ? 'Login' : 'Create account'
          )}
        </Button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/80 px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div 
              ref={googleButtonRef} 
              className={googleLoading ? 'opacity-50 pointer-events-none' : ''}
            />
            {googleLoading && (
              <div className="absolute flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
