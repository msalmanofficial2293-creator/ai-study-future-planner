import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function PerformanceLoading() {
  return (
    <AppPage>
      <LoadingState label="Loading your performance" />
    </AppPage>
  );
}
