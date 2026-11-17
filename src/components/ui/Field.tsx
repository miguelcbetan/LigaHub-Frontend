import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

const controlBase =
  "w-full rounded-lg border bg-white text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";

const controlState = (error?: string) =>
  error
    ? "border-co-red focus:ring-co-red/30"
    : "border-zinc-200 focus:border-co-blue focus:ring-co-blue/20 dark:border-zinc-800 dark:focus:border-co-yellow dark:focus:ring-co-yellow/20";

interface FieldWrapperProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  labelAction?: ReactNode;
}

function FieldWrapper({ id, label, hint, error, children, labelAction }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      {(label || labelAction) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs text-co-red">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  labelAction?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, rightSlot, labelAction, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper id={inputId} label={label} hint={hint} error={error} labelAction={labelAction}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400 [&>svg]:size-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(controlBase, controlState(error), "h-10 px-3", icon && "pl-9", rightSlot && "pr-10", className)}
          {...props}
        />
        {rightSlot && <span className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</span>}
      </div>
    </FieldWrapper>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <FieldWrapper id={selectId} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(controlBase, controlState(error), "h-10 appearance-none pl-3 pr-9", className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      </div>
    </FieldWrapper>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <FieldWrapper id={areaId} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={areaId}
        className={cn(controlBase, controlState(error), "min-h-24 px-3 py-2", className)}
        {...props}
      />
    </FieldWrapper>
  );
});
