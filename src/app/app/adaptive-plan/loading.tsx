import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function AdaptivePlanLoading() {
  return (
    <AppPage>
      <LoadingState label="Loading your Adaptive Study Plan" />
    </AppPage>
  );
}
