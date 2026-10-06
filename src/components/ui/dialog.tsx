"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
};

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog-panel"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
    >
      <h2 id={titleId} className="card-heading">
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className="body-secondary mt-2">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
      <div className="mt-6">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
