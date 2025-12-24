import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/context/CreditsContext';
import { getGenerations, Generation } from '@/services/api';
import { BuyCreditsModal } from '@/components/credits/BuyCreditsModal';
import { Loader2, LogOut, Download, Coins, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Account() {
  const { user, isLoggedIn, credits, login, logout, loading: authLoading } = useCredits();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isLoggedIn) {
      loadGenerations();
    }
  }, [isLoggedIn]);

  const loadGenerations = async () => {
    setLoadingGenerations(true);
    try {
      const data = await getGenerations();
      setGenerations(data);
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setLoadingGenerations(false);
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
    
    setLoginLoading(true);
    try {
      await login(email, password);
      toast({
        title: 'Welcome!',
        description: 'You are now logged in.',
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Please check your credentials.',
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
    link.download = `ai-portrait-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <Layout fullPage>
        <SEO title="Account" description="Manage your AI portrait account" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullPage>
      <SEO title="Account" description="Manage your AI portrait account" />
      
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
          Account
        </h1>

        {!isLoggedIn ? (
          /* Login form */
          <div className="max-w-sm mx-auto">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Login to Your Account
              </h2>
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
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Demo: Enter any email and password to login.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile section */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>

            {/* Credits section */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Credits</h2>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-accent" />
                    <span className="text-2xl font-bold text-foreground">{credits}</span>
                    <span className="text-muted-foreground">available</span>
                  </div>
                </div>
                <Button onClick={() => setShowBuyModal(true)}>
                  Buy Credits
                </Button>
              </div>
            </div>

            {/* Generations history */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Your Generations
              </h2>
              
              {loadingGenerations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : generations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No generations yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {generations.filter(g => g.status === 'completed').map((generation) => (
                    <div
                      key={generation.id}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
                    >
                      <img
                        src={generation.outputUrl}
                        alt="Generated portrait"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownload(generation.outputUrl)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <BuyCreditsModal open={showBuyModal} onOpenChange={setShowBuyModal} />
    </Layout>
  );
}
