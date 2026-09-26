"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  width = "max-w-[780px]",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-[rgba(0,0,0,0.45)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[80vh] w-full ${width} flex-col overflow-hidden rounded-[20px] bg-white shadow-lift`}
      >
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-border-soft">
          <button
            onClick={onClose}
            className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-soft"
            aria-label="Close"
          >
            ✕
          </button>
          {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
        {footer ? (
          <div className="flex h-20 shrink-0 items-center justify-between border-t border-border-soft px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
