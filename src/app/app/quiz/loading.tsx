import { AppPage } from "@/components/ui/app-page";
import { LoadingState } from "@/components/ui/feedback";

export default function QuizLoading() {
  return (
    <AppPage scene="quiz">
      <LoadingState label="Loading your quizzes" />
    </AppPage>
  );
}
