import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function DailyTasksLoading() {
  return (
    <AppPage scene="tasks">
      <LoadingState label="Loading your Daily Tasks" />
    </AppPage>
  );
}
