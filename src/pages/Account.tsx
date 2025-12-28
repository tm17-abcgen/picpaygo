import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/context/CreditsContext';
import { getGenerations, clearGuestHistory, Generation, requestVerificationEmail, ApiError } from '@/services/api';
import { BuyCreditsModal } from '@/components/credits/BuyCreditsModal';
import { Loader2, LogOut, Download, Coins, ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validatePassword } from '@/lib/passwordPolicy';

export default function Account() {
  const { user, isLoggedIn, credits, refreshCredits, login, register, logout, loading: authLoading } = useCredits();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'credits' | 'history'>('profile');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [clearingHistory, setClearingHistory] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Resend verification state
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkoutStatus = searchParams.get('checkout');

  useEffect(() => {
    if (checkoutStatus !== 'success' && checkoutStatus !== 'cancel') return;

    if (checkoutStatus === 'cancel') {
      toast({
        title: 'Payment canceled',
        description: 'No charges were made.',
      });
      navigate('/account', { replace: true });
      return;
    }

    toast({
      title: 'Payment successful',
      description: 'Credits may take a moment to appear.',
    });

    void refreshCredits();

    let retries = 0;
    const interval = window.setInterval(() => {
      void refreshCredits();
      retries += 1;
      if (retries >= 3) {
        window.clearInterval(interval);
        navigate('/account', { replace: true });
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [checkoutStatus, navigate, refreshCredits, toast]);

  useEffect(() => {
    // Always load generations - works for both guests and logged in users
    loadGenerations();
  }, [isLoggedIn]); // Reload when login state changes

  const loadGenerations = async () => {
    setLoadingGenerations(true);
    try {
      const data = await getGenerations();
      setGenerations(data.generations);
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setLoadingGenerations(false);
    }
  };

  const handleClearHistory = async () => {
    if (isLoggedIn) {
      toast({
        title: 'Not available',
        description: 'History clearing is only available for guest accounts.',
        variant: 'destructive',
      });
      return;
    }

    setClearingHistory(true);
    try {
      await clearGuestHistory();
      setGenerations([]);
      toast({
        title: 'History cleared',
        description: 'Your generation history has been cleared.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear history.';
      toast({
        title: 'Failed to clear history',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    if (authMode === 'register') {
      const { valid, message } = validatePassword(password);
      if (!valid) {
        toast({ title: 'Invalid password', description: message, variant: 'destructive' });
        return;
      }
    }

    setLoginLoading(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
        toast({
          title: 'Welcome!',
          description: 'You are now logged in.',
        });
      } else {
        const result = await register(email, password);
        toast({
          title: 'Check your email',
          description: result.verificationRequired
            ? 'We sent a verification link. Verify your email, then log in.'
            : 'Account created. Please log in.',
        });
        setAuthMode('login');
      }
    } catch (error) {
      // Check for 403 unverified email on login
      if (authMode === 'login' && error instanceof ApiError && error.status === 403) {
        setResendEmail(email);
        setShowResendForm(true);
        toast({
          title: 'Email not verified',
          description: 'Please verify your email. We can resend the verification link.',
          variant: 'destructive',
        });
        setLoginLoading(false);
        return;
      }

      const message = error instanceof Error ? error.message : 'Please check your credentials.';
      toast({
        title: authMode === 'login' ? 'Login failed' : 'Registration failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setGenerations([]);
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setResendLoading(true);
    try {
      await requestVerificationEmail(resendEmail);
      toast({
        title: 'Check your email',
        description: 'If an account exists and requires verification, we\'ve sent an email.',
      });
      setShowResendForm(false);
      setResendEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.';
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-portrait-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <Layout>
        <SEO title="Account" description="Manage your AI portrait account" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Account" description="Manage your AI portrait account" />
      
      <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
          Account
        </h1>

        <div className="flex flex-wrap justify-center gap-6 border-b border-border/60 pb-4 mb-6">
          {['profile', 'credits', 'history'].map((tab) => {
            const label = tab === 'history' ? 'My Generations' : tab.charAt(0).toUpperCase() + tab.slice(1);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`text-[11px] uppercase tracking-[0.35em] pb-2 border-b transition-colors ${
                  isActive ? 'text-foreground border-foreground/70' : 'text-muted-foreground/70 border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {activeTab === 'profile' && (
          <>
            {!isLoggedIn ? (
              <div className="max-w-md mx-auto">
                <div className="p-6 rounded-2xl border border-border/60 bg-background/80">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                    {authMode === 'login' ? 'Login' : 'Register'}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      {authMode === 'login' ? 'Login to your account' : 'Create your account'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground/80 hover:text-foreground"
                    >
                      {authMode === 'login' ? 'Register' : 'Login'}
                    </button>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="text-sm font-medium text-foreground mb-1 block">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loginLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="text-sm font-medium text-foreground mb-1 block">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loginLoading}
                      />
                      {authMode === 'register' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          8+ characters with uppercase, lowercase, and number
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {authMode === 'login' ? 'Logging in...' : 'Creating account...'}
                        </>
                      ) : (
                        authMode === 'login' ? 'Login' : 'Create account'
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-4 text-left">
                    You will need to verify your email before you can log in.
                  </p>
                  {authMode === 'login' && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      {!showResendForm ? (
                        <button
                          type="button"
                          onClick={() => setShowResendForm(true)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Didn't receive verification email?
                        </button>
                      ) : (
                        <form onSubmit={handleResendVerification} className="space-y-3">
                          <p className="text-xs text-muted-foreground mb-2">
                            Enter your email to resend the verification link.
                          </p>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            value={resendEmail}
                            onChange={(e) => setResendEmail(e.target.value)}
                            disabled={resendLoading}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={resendLoading}
                            >
                              {resendLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                'Resend verification'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowResendForm(false);
                                setResendEmail('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="p-6 rounded-2xl border border-border/60 bg-background/80">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'credits' && (
          <div className="max-w-md mx-auto">
            <div className="p-6 rounded-2xl border border-border/60 bg-background/80">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Credits</h2>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-accent" />
                    <span className="text-2xl font-bold text-foreground">{credits}</span>
                    <span className="text-muted-foreground">available</span>
                  </div>
                </div>
                {isLoggedIn ? (
                  <Button onClick={() => setShowBuyModal(true)}>
                    Buy Credits
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setActiveTab('profile')}>
                    Login to Buy
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground text-center flex-1">
                {isLoggedIn ? 'Your Generations' : 'Your Generations (Guest)'}
              </h2>
              {!isLoggedIn && generations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={clearingHistory}
                >
                  {clearingHistory ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear History
                    </>
                  )}
                </Button>
              )}
            </div>
            {loadingGenerations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/70 rounded-2xl">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No generations yet.</p>
                {!isLoggedIn && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your generations are saved automatically. Create an account to keep them permanently.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {generations
                  .filter((generation) => generation.status === 'completed')
                  .map((generation) => {
                    // Get detailed generation info for presigned URLs
                    // For now, use the stored outputUrl if available
                    const outputUrl = generation.outputUrl || '';
                    return (
                      <div
                        key={generation.id}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-secondary"
                      >
                        <img
                          src={outputUrl}
                          alt="Generated portrait"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDownload(outputUrl)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
      
      <BuyCreditsModal open={showBuyModal} onOpenChange={setShowBuyModal} />
    </Layout>
  );
}
