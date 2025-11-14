"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ModalTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface ModalBodyProps {
  children: React.ReactNode;
}

interface ModalContentProps {
  children: React.ReactNode;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

// Define context first
const ModalContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const Modal = ({ children, open, onOpenChange }: ModalProps) => {
  const [openState, setOpenState] = React.useState(open || false);

  useEffect(() => {
    if (open !== undefined) {
      setOpenState(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setOpenState(newOpen);
    }
  };

  const contextValue = React.useMemo(
    () => ({ open: openState, setOpen: handleOpenChange }),
    [openState, onOpenChange]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

const useModalContext = () => React.useContext(ModalContext);

export const ModalTrigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const { setOpen } = useModalContext();

    if (props.asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        onClick: () => setOpen(true),
      } as any);
    }

    return (
      <button ref={ref} className={className} onClick={() => setOpen(true)} {...props}>
        {children}
      </button>
    );
  }
);

ModalTrigger.displayName = "ModalTrigger";

export const ModalBody = ({ children }: ModalBodyProps) => {
  const { open, setOpen } = useModalContext();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          />
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative mx-auto w-full max-w-2xl"
              >
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 z-50 rounded-xl border border-slate-600 bg-slate-900/80 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {children}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const ModalContent = ({ children }: ModalContentProps) => {
  return (
    <div className="relative z-50 mx-auto flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
      {children}
    </div>
  );
};

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return (
    <div className={`flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-800/50 p-4 ${className}`}>
      {children}
    </div>
  );
};

