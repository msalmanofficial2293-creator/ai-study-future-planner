import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function AiTutorLoading() {
  return (
    <AppPage>
      <LoadingState label="Loading your tutor" />
    </AppPage>
  );
}
