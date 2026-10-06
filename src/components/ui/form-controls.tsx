import type {
  ComponentPropsWithoutRef,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

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
  children: (control: FieldControlProps) => ReactNode;
};

export function Field({ id, label, description, error, children }: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
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

function controlProps({ invalid, describedBy }: ControlProps) {
  return {
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    className: "field-control",
  };
}

type InputProps = ComponentPropsWithoutRef<"input"> & ControlProps;

export function Input({ invalid, describedBy, ...props }: InputProps) {
  return <input {...props} {...controlProps({ invalid, describedBy })} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps;

export function Textarea({ invalid, describedBy, ...props }: TextareaProps) {
  return <textarea {...props} {...controlProps({ invalid, describedBy })} />;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & ControlProps;

export function Select({ invalid, describedBy, children, ...props }: SelectProps) {
  return (
    <select {...props} {...controlProps({ invalid, describedBy })}>
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
