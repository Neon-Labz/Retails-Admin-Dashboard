"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variants: Record<string, string> = {
      primary: "bg-[#093B84] text-white hover:bg-[#072E66] focus-visible:outline-[#093B84] shadow-sm",
      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-slate-400",
      danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-sm",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
      outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    };
    const sizes: Record<string, string> = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ----------------------------------- Input ---------------------------------- */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, hint, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#093B84] focus:ring-2 focus:ring-[#093B84]/20",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

/* --------------------------------- Textarea --------------------------------- */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#093B84] focus:ring-2 focus:ring-[#093B84]/20",
          error && "border-rose-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";

/* ---------------------------------- Select ---------------------------------- */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, id, children, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#093B84] focus:ring-2 focus:ring-[#093B84]/20",
          error && "border-rose-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
});
Select.displayName = "Select";

/* ----------------------------------- Badge ---------------------------------- */
export function Badge({ children, color = "slate" }: { children: ReactNode; color?: "slate" | "green" | "red" | "yellow" | "blue" | "purple" | "orange" }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
    purple: "bg-violet-100 text-violet-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize", colors[color])}>
      {children}
    </span>
  );
}

/* ----------------------------------- Card ----------------------------------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),0_2px_6px_-1px_rgba(15,23,42,0.02)] transition-shadow duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------- StatCard --------------------------------- */
export function StatCard({
  label,
  value,
  icon,
  color = "indigo",
  trend,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: "indigo" | "emerald" | "rose" | "amber" | "sky" | "violet" | "purple" | "cyan";
  trend?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-[#EEF2FF] text-[#093B84] border border-[#093B84]/20",
    emerald: "bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]",
    rose: "bg-[#FFF1F2] text-[#F43F5E] border border-[#FECDD3]",
    amber: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
    sky: "bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]",
    violet: "bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]",
    purple: "bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]",
    cyan: "bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC]",
  };
  return (
    <div className="rounded-2xl border border-[#0F1E41]/35 bg-gradient-to-br from-[#E1ECFA] to-[#D4E4F7] p-6 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.12),0_4px_10px_-2px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-4px_rgba(15,23,42,0.16)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#475569]">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shadow-xs", colors[color])}>{icon}</div>
      </div>
      <p className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-[#0B132B]">{value}</p>
      {trend && <p className="mt-1.5 text-xs font-medium text-slate-500">{trend}</p>}
    </div>
  );
}

/* --------------------------------- Spinner ---------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-[#093B84]", className)} />;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* -------------------------------- EmptyState -------------------------------- */
export function EmptyState({
  title = "No data found",
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon && <div className="mb-2 text-slate-300">{icon}</div>}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ----------------------------------- Tabs ------------------------------------ */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition",
            active === tab.key ? "border-[#093B84] text-[#093B84]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#093B84]" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}
