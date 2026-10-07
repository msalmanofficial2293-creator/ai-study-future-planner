"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <LogoutSubmit className={className} />
    </form>
  );
}

function LogoutSubmit({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" loading={pending} disabled={pending} className={className}>
      {pending ? "Logging out" : "Log out"}
    </Button>
  );
}
