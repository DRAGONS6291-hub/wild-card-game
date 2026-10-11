import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SUITS, Suit, SUITS_FR } from "@/lib/game-types";
import { Heart, Diamond, Club, Spade } from "lucide-react";

const suitIcons: Record<Suit, React.ElementType> = { Hearts: Heart, Diamonds: Diamond, Clubs: Club, Spades: Spade };
interface SuitChoiceDialogProps { isOpen: boolean; onSuitChoose: (suit: Suit) => void; }

export function SuitChoiceDialog({ isOpen, onSuitChoose }: SuitChoiceDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Choisissez une couleur</DialogTitle><DialogDescription>Vous avez joué une carte spéciale. Sélectionnez la couleur que le prochain joueur devra suivre.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {SUITS.map((suit) => {
            const Icon = suitIcons[suit];
            const isRed = suit === 'Hearts' || suit === 'Diamonds';
            return <Button key={suit} variant="outline" className={`h-28 flex flex-col gap-2 border-2 hover:border-primary ${isRed ? 'hover:text-red-600' : 'hover:text-black'}`} onClick={() => onSuitChoose(suit)}><Icon className={`h-10 w-10 ${isRed ? 'text-red-600' : 'text-black'}`} fill="currentColor" /><span className="text-lg text-foreground">{SUITS_FR[suit]}</span></Button>;
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
