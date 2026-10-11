import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
interface PassTurnDialogProps { isOpen: boolean; onPassTurn: () => void; nextPlayerName: string; }

export function PassTurnDialog({ isOpen, onPassTurn, nextPlayerName }: PassTurnDialogProps) {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px] flex flex-col items-center">
        <DialogHeader className="text-center"><DialogTitle className="text-2xl">Tour suivant</DialogTitle><DialogDescription>Passez l'appareil à <strong className="text-primary">{nextPlayerName}</strong>.</DialogDescription></DialogHeader>
        <div className="py-4"><Button size="lg" className="h-24 w-64 text-xl" onClick={onPassTurn}>C'est à <strong className="mx-1">{nextPlayerName}</strong> de jouer<ArrowRight className="ml-2 h-6 w-6" /></Button></div>
      </DialogContent>
    </Dialog>
  );
}
