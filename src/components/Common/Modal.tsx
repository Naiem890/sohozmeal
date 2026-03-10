import { type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ModalProps {
  children: ReactNode;
  setShowModal?: (open: boolean) => void;
  className?: string;
}

export default function Modal({ children, setShowModal, className }: ModalProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open && setShowModal) setShowModal(false); }}>
      <DialogContent className={`max-w-2xl ${className || ""}`}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
