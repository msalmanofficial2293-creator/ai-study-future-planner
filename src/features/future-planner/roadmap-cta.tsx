"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RoadmapCta() {
  const [notice, setNotice] = useState("");

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        type="button"
        onClick={() => {
          setNotice(
            "AI roadmap generation is not available yet. Your goal is saved here and will be the input when that step opens.",
          );
        }}
      >
        Generate My AI Future Roadmap
      </Button>
      <p className="caption">
        This uses your current goal. Generation does not run yet, and no roadmap is created.
      </p>
      {notice ? (
        <p className="rounded-2xl bg-info-surface px-4 py-3 text-info" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
