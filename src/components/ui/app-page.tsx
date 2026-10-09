import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

type AppPageProps = {
  children: ReactNode;
  className?: string;
  /** Compact stack for denser screens such as Settings. */
  dense?: boolean;
};

export function AppPage({ children, className, dense = false }: AppPageProps) {
  return (
    <Container className="app-page">
      <div className={cn("app-page-stack", dense && "app-page-stack-dense", className)}>
        {children}
      </div>
    </Container>
  );
}
