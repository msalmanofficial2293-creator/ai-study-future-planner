"use server";

import { redirect } from "next/navigation";
import { generateAndSaveRoadmap } from "@/services/roadmap";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export type RoadmapActionState = {
  formError?: string;
  message?: string;
};

const generateInFlight = new Map<string, Promise<RoadmapActionState>>();

export async function generateRoadmapAction(
  _previous: RoadmapActionState,
  formData: FormData,
): Promise<RoadmapActionState> {
  if (!(formData instanceof FormData)) {
    return { formError: "Something went wrong. Please try again." };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = generateInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = persistRoadmap(user.id).finally(() => {
    generateInFlight.delete(user.id);
  });
  generateInFlight.set(user.id, outcome);
  return outcome;
}

async function persistRoadmap(userId: string): Promise<RoadmapActionState> {
  const result = await generateAndSaveRoadmap(userId);

  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (!result.ok && result.reason === "missing-goal") {
    return { formError: "Add a career goal before generating a roadmap." };
  }

  if (!result.ok) {
    return { formError: "Something went wrong. Please try again." };
  }

  return { message: "Your roadmap is saved." };
}
