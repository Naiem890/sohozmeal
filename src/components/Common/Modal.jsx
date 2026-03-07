import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Modal({ children, setShowModal, className }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open && setShowModal) setShowModal(false); }}>
      <DialogContent className={`max-w-2xl ${className || ""}`}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
