import type {
  ComponentPropsWithoutRef,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

type FieldControlProps = {
  id: string;
  invalid: boolean;
  describedBy?: string;
};

type FieldProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

export function Field({ id, label, description, error, className, children }: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("field", className)}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {description ? (
        <p className="field-description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {children({ id, invalid: Boolean(error), describedBy })}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          Error: {error}
        </p>
      ) : null}
    </div>
  );
}

type ControlProps = {
  invalid?: boolean;
  describedBy?: string;
};

function controlProps({
  invalid,
  describedBy,
  className,
}: ControlProps & { className?: string }) {
  return {
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    className: cn("field-control", className),
  };
}

type InputProps = ComponentPropsWithoutRef<"input"> & ControlProps;

export function Input({ invalid, describedBy, className, ...props }: InputProps) {
  return <input {...props} {...controlProps({ invalid, describedBy, className })} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps;

export function Textarea({ invalid, describedBy, className, ...props }: TextareaProps) {
  return <textarea {...props} {...controlProps({ invalid, describedBy, className })} />;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & ControlProps;

export function Select({ invalid, describedBy, className, children, ...props }: SelectProps) {
  return (
    <select {...props} {...controlProps({ invalid, describedBy, className })}>
      {children}
    </select>
  );
}

type ChoiceProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  label: string;
};

function Choice({
  id,
  label,
  type,
  ...props
}: ChoiceProps & { type: "checkbox" | "radio" }) {
  return (
    <label className="choice" htmlFor={id}>
      <input id={id} type={type} {...props} />
      <span className="field-label">{label}</span>
    </label>
  );
}

export function Checkbox(props: ChoiceProps) {
  return <Choice type="checkbox" {...props} />;
}

export function Radio(props: ChoiceProps) {
  return <Choice type="radio" {...props} />;
}
