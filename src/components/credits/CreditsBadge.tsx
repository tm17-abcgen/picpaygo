import { useState } from 'react';
import { Coins } from 'lucide-react';
import { useCredits } from '@/context/CreditsContext';
import { BuyCreditsModal } from './BuyCreditsModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function CreditsBadge() {
  const { credits, loading, isLoggedIn } = useCredits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = () => {
    if (!isLoggedIn) {
      toast({
        title: 'Login required',
        description: 'Sign in to buy credits.',
      });
      navigate('/account');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
        aria-label={`${credits} credits available. ${isLoggedIn ? 'Click to buy more.' : 'Login to buy credits.'}`}
      >
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-foreground">
          {loading ? '...' : credits}
        </span>
        <span className="text-muted-foreground hidden sm:inline">credits</span>
      </button>
      
      <BuyCreditsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
