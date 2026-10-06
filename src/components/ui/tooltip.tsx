import { useId, type ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const tooltipId = useId();

  return (
    <span className="tooltip">
      <span aria-describedby={tooltipId} className="inline-flex">
        {children}
      </span>
      <span id={tooltipId} role="tooltip" className="tooltip-bubble">
        {content}
      </span>
    </span>
  );
}
