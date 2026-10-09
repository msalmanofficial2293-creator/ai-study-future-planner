import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function PersonalizationLoading() {
  return (
    <AppPage>
      <LoadingState label="Loading personalization" />
    </AppPage>
  );
}
