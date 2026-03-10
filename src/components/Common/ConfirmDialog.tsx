import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ButtonProps["variant"];
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; options: ConfirmOptions }>({
    open: false,
    options: {},
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({ open: true, options });
      }),
    []
  );

  const handle = (result: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  const {
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
  } = state.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => { if (!open) handle(false); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription className="pt-0.5 leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-w-20"
              onClick={() => handle(false)}
            >
              {cancelText}
            </Button>
            <Button
              autoFocus
              variant={variant}
              size="sm"
              className="min-w-20"
              onClick={() => handle(true)}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = (): ConfirmFn | null => useContext(ConfirmContext);
