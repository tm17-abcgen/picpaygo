import { useState } from 'react';
import { Coins } from 'lucide-react';
import { useCredits } from '@/context/CreditsContext';
import { BuyCreditsModal } from './BuyCreditsModal';

export function CreditsBadge() {
  const { credits, loading } = useCredits();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
        aria-label={`${credits} credits available. Click to buy more.`}
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
