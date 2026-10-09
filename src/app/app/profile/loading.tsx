import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function ProfileLoading() {
  return (
    <AppPage scene="profile">
      <LoadingState label="Loading your profile" />
    </AppPage>
  );
}