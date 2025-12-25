import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/context/CreditsContext';
import { useToast } from '@/hooks/use-toast';

interface LoginPromptProps {
  onSuccess?: () => void;
}

export function LoginPrompt({ onSuccess }: LoginPromptProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useCredits();
  const { toast } = useToast();

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
          disabled={loading}
          aria-label="Email address"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          aria-label="Password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
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
    </div>
  );
}
