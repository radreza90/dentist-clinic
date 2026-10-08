"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };
type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
};

type AdminFeedbackValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (title: string, tone?: ToastTone, description?: string) => void;
};

const AdminFeedbackContext = createContext<AdminFeedbackValue | null>(null);

export function useAdminFeedback() {
  const value = useContext(AdminFeedbackContext);
  if (!value) throw new Error("useAdminFeedback must be used within AdminFeedbackProvider");
  return value;
}

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmation, setConfirmation] = useState<ConfirmOptions | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const resolveConfirmation = useRef<((confirmed: boolean) => void) | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const confirmationRef = useRef<HTMLElement>(null);

  const closeConfirmation = useCallback((confirmed: boolean) => {
    resolveConfirmation.current?.(confirmed);
    resolveConfirmation.current = null;
    setConfirmation(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    if (resolveConfirmation.current) closeConfirmation(false);
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirmation(options);
    return new Promise<boolean>((resolve) => {
      resolveConfirmation.current = resolve;
    });
  }, [closeConfirmation]);

  const toast = useCallback((title: string, tone: ToastTone = "success", description?: string) => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, title, description, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    if (!confirmation) return;
    confirmationRef.current?.querySelector<HTMLElement>("button")?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeConfirmation(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      if (!resolveConfirmation.current) previousFocus.current?.focus();
    };
  }, [confirmation, closeConfirmation]);

  return (
    <AdminFeedbackContext.Provider value={{ confirm, toast }}>
      {children}
      <div className="admin-toast-stack" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((item) => (
          <div key={item.id} className={`admin-toast admin-toast-${item.tone}`} role={item.tone === "error" ? "alert" : "status"}>
            <span className="admin-toast-icon" aria-hidden="true">
              {item.tone === "success" ? "✓" : item.tone === "error" ? "!" : "i"}
            </span>
            <span className="admin-toast-copy">
              <strong>{item.title}</strong>
              {item.description && <small>{item.description}</small>}
            </span>
            <button type="button" className="admin-toast-close" aria-label="بستن اعلان" onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}>×</button>
          </div>
        ))}
      </div>
      {confirmation && (
        <div className="admin-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeConfirmation(false); }}>
          <section
            ref={confirmationRef}
            className="admin-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            aria-describedby={confirmation.description ? "admin-confirm-description" : undefined}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const buttons = confirmationRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
              if (!buttons?.length) return;
              const first = buttons[0];
              const last = buttons[buttons.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <span className={`admin-confirm-icon admin-confirm-icon-${confirmation.tone || "warning"}`} aria-hidden="true">
              {confirmation.tone === "danger" ? "!" : "?"}
            </span>
            <h2 id="admin-confirm-title">{confirmation.title}</h2>
            {confirmation.description && <p id="admin-confirm-description">{confirmation.description}</p>}
            <div className="admin-confirm-actions">
              <button type="button" className="admin-confirm-cancel" onClick={() => closeConfirmation(false)}>{confirmation.cancelLabel || "انصراف"}</button>
              <button type="button" className={`admin-confirm-submit admin-confirm-submit-${confirmation.tone || "warning"}`} onClick={() => closeConfirmation(true)}>{confirmation.confirmLabel || "تأیید"}</button>
            </div>
          </section>
        </div>
      )}
    </AdminFeedbackContext.Provider>
  );
}
