import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff, Star, X } from "lucide-react";

// Shared form primitives: uppercase label, 50px-tall input with an optional leading icon, inline error text.
type FieldProps = { label: string; required?: boolean; icon?: ReactNode; error?: string; hint?: string; htmlFor?: string; className?: string; children: ReactNode };
export function Field({ label, required, icon, error, hint, htmlFor, className = "", children }: FieldProps) {
  return (
    <div className={`gi-field ${error ? "has-error" : ""} ${className}`}>
      <label className="gi-label" htmlFor={htmlFor}>{label}{required && <span className="gi-req">*</span>}</label>
      <div className={`gi-control ${icon ? "has-icon" : ""}`}>{icon && <span className="gi-icon">{icon}</span>}{children}</div>
      {error ? <p className="gi-error-text">{error}</p> : hint ? <p className="gi-hint">{hint}</p> : null}
    </div>
  );
}

export function GiInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`gi-input ${className}`} />;
}

export function GiTextarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`gi-input gi-textarea ${className}`} />;
}

export function GiSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`gi-input ${className}`} />;
}

// Password field with the show/hide eye on the right.
export function PasswordInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input {...props} type={show ? "text" : "password"} className={`gi-input has-toggle ${className}`} />
      <button type="button" className="gi-toggle" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </>
  );
}

// Tap-to-rate stars with a small pop on the one just chosen.
export function StarRating({ value, onChange, max = 5, readOnly = false, size = 28 }: { value: number; onChange?: (n: number) => void; max?: number; readOnly?: boolean; size?: number }) {
  const [pop, setPop] = useState(0);
  return (
    <div className={`gi-stars ${readOnly ? "is-readonly" : ""}`} role={readOnly ? undefined : "radiogroup"}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" disabled={readOnly} aria-label={`Rate ${n} out of ${max}`} aria-pressed={n <= value} className={`gi-star ${n <= value ? "is-filled" : ""} ${pop === n ? "is-pop" : ""}`} onClick={() => { onChange?.(n); setPop(n); }}>
          <Star size={size} fill={n <= value ? "currentColor" : "transparent"} />
        </button>
      ))}
    </div>
  );
}

export function FormNotice({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  return <div className={`gi-notice gi-notice-${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

export function Spinner() {
  return <span className="gi-spinner" aria-hidden="true" />;
}

// Centered dialog: full width with a small gutter on phones, scrolls inside itself when taller than the screen.
export function GiModal({ title, onClose, busy, footer, children }: { title: string; onClose: () => void; busy?: boolean; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="gi-modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="gi-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="gi-modal-head"><h2>{title}</h2><button type="button" className="gi-modal-close" onClick={onClose} disabled={busy} aria-label="Close"><X size={20} /></button></div>
        <div className="gi-modal-body">{children}</div>
        {footer && <div className="gi-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
