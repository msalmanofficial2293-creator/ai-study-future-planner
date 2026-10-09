import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function PersonalizationLoading() {
  return (
    <AppPage scene="personalization">
      <LoadingState label="Loading personalization" />
    </AppPage>
  );
}
