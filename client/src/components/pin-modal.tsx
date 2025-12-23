import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function PINModal({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
  title = "Enter PIN",
  description = "Enter your 4-digit PIN to complete this transaction"
}: PINModalProps) {
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must contain only numbers",
        variant: "destructive",
      });
      return;
    }

    onSuccess(pin);
    setPin("");
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>

          <Input
            type="password"
            inputMode="numeric"
            placeholder="••••"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
            className="text-center text-2xl tracking-widest"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pin.length !== 4 || isLoading}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify PIN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
