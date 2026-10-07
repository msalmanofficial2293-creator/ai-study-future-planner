import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/feedback";

export default function QuizLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <LoadingState label="Loading your quiz" />
    </Container>
  );
}
