import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

export type AppPageScene =
  | "dashboard"
  | "planner"
  | "study"
  | "tasks"
  | "quiz"
  | "performance"
  | "adaptive"
  | "tutor"
  | "personalization"
  | "profile"
  | "settings";

type AppPageProps = {
  children: ReactNode;
  className?: string;
  /** Compact stack for denser screens such as Settings. */
  dense?: boolean;
  /** Page background scene for the premium multi-color system. */
  scene?: AppPageScene;
};

export function AppPage({
  children,
  className,
  dense = false,
  scene = "dashboard",
}: AppPageProps) {
  return (
    <div className={cn("app-page-scene", `page-scene-${scene}`)}>
      <Container className="app-page">
        <div className={cn("app-page-stack", dense && "app-page-stack-dense", className)}>
          {children}
        </div>
      </Container>
    </div>
  );
}
