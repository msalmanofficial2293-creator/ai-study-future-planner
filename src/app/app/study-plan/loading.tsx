import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function StudyPlanLoading() {
  return (
    <AppPage>
      <LoadingState label="Loading your Study Plan" />
    </AppPage>
  );
}
