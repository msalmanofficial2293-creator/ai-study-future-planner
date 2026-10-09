import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function FuturePlannerLoading() {
  return (
    <AppPage scene="planner">
      <LoadingState label="Loading your Future Planner" />
    </AppPage>
  );
}
