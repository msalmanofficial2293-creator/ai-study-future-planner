"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmit />
    </form>
  );
}

function LogoutSubmit() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" loading={pending} disabled={pending}>
      {pending ? "Logging out" : "Log out"}
    </Button>
  );
}
