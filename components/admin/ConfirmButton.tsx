"use client";

import { useEffect, useState } from "react";

type ConfirmButtonProps = {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

// Two-step destructive action without a blocking window.confirm():
// the first click arms the button ("Sure?"), the second click fires
// it. It disarms by itself after a few seconds or on "Cancel".
export default function ConfirmButton({
  label,
  confirmLabel = "Yes, confirm",
  onConfirm,
  disabled,
  className = "btn-danger btn-sm"
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(timer);
  }, [armed]);

  if (!armed) {
    return (
      <button type="button" className={className} disabled={disabled} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        className="btn btn-sm bg-rust text-white hover:bg-rust/90"
        disabled={disabled}
        onClick={() => {
          setArmed(false);
          void onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="text-xs text-ink/50 hover:text-ink" onClick={() => setArmed(false)}>
        Cancel
      </button>
    </span>
  );
}
