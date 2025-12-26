import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CREDIT_PACKS, createCheckout } from '@/services/api';
import { useCredits } from '@/context/CreditsContext';
import { useToast } from '@/hooks/use-toast';

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useCredits();
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!selectedPack) return;

    if (!isLoggedIn) {
      toast({
        title: 'Login required',
        description: 'Please sign in to buy credits.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const { url } = await createCheckout(selectedPack);
      window.location.assign(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast({
        title: 'Purchase failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Each generation costs 1 credit. Choose a pack that works for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack.id)}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                selectedPack === pack.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPack === pack.id ? 'border-accent bg-accent' : 'border-muted-foreground'
                }`}>
                  {selectedPack === pack.id && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="font-medium">{pack.credits} credits</span>
              </div>
              <span className="font-semibold">${pack.price.toFixed(2)}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handlePurchase}
          disabled={!selectedPack || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Purchase'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
