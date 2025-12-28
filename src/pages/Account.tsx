import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/context/CreditsContext';
import { getGenerations, clearGuestHistory, Generation, forgotPassword, changePassword, deleteAccount } from '@/services/api';
import { BuyCreditsModal } from '@/components/credits/BuyCreditsModal';
import { Loader2, LogOut, Download, Coins, ImageIcon, Trash2, KeyRound, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  const { toast } = useToast();

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    console.log('[Account:handleLogin] Form submitted', { authMode, email });
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
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

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `picpaygo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast({
        title: 'Missing email',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast({
        title: 'Check your email',
        description: 'If an account exists with this email, we sent a password reset link.',
      });
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error) {
      toast({
        title: 'Request failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setChangePasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to confirm deletion.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      setShowDeleteConfirm(false);
      setDeletePassword('');
      navigate('/');
      // Force page reload to clear all state
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to delete account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <SEO title="Account" description="Manage your PicPayGo account" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Account" description="Manage your PicPayGo account" />
      
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
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginLoading}
                      onClick={() => console.log('[Account:Button] Button clicked', { authMode, email, password, loginLoading })}
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

                  {authMode === 'login' && !showForgotPassword && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-muted-foreground hover:text-foreground underline mt-2"
                    >
                      Forgot your password?
                    </button>
                  )}

                  {showForgotPassword && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <p className="text-sm font-medium text-foreground mb-2">Reset Password</p>
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          disabled={forgotLoading}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={forgotLoading} className="flex-1">
                            {forgotLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Send Reset Link'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotEmail('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                {/* Profile Info */}
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

                {/* Change Password */}
                <div className="p-6 rounded-2xl border border-border/60 bg-background/80">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label htmlFor="currentPassword" className="text-sm font-medium text-foreground mb-1 block">
                        Current Password
                      </label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={changePasswordLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="text-sm font-medium text-foreground mb-1 block">
                        New Password
                      </label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={changePasswordLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmNewPassword" className="text-sm font-medium text-foreground mb-1 block">
                        Confirm New Password
                      </label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        disabled={changePasswordLoading}
                      />
                    </div>
                    <Button type="submit" disabled={changePasswordLoading} className="w-full">
                      {changePasswordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="p-6 rounded-2xl border border-destructive/30 bg-background/80">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h2 className="text-lg font-semibold text-foreground">Delete Account</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete My Account
                    </Button>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="space-y-3">
                      <p className="text-sm text-destructive font-medium">
                        Enter your password to confirm deletion:
                      </p>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        disabled={deleteLoading}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={deleteLoading}
                          className="flex-1"
                        >
                          {deleteLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Confirm Delete'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
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
