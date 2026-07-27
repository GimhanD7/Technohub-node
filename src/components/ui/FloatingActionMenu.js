"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const defaultButtonClassName = "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50";

export function FloatingActionMenu({
  open,
  onOpenChange,
  label,
  trigger,
  children,
  disabled = false,
  estimatedHeight = 180,
  widthClassName = "w-48",
  buttonClassName = defaultButtonClassName
}) {
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const handleToggle = (event) => {
    if (open) {
      onOpenChange(false);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const top = spaceBelow >= estimatedHeight + 12
      ? buttonRect.bottom + 8
      : Math.max(8, buttonRect.top - estimatedHeight - 8);

    setPosition({
      top,
      right: Math.max(8, window.innerWidth - buttonRect.right)
    });
    onOpenChange(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={buttonClassName}
        aria-label={label}
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && createPortal(
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] cursor-default"
            onClick={() => onOpenChange(false)}
            aria-label="Close actions"
          />
          <div
            className={`fixed z-[80] ${widthClassName} rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-2xl`}
            style={{ top: position.top, right: position.right }}
          >
            {children}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
