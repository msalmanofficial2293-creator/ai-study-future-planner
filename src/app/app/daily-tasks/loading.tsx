import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/feedback";

export default function DailyTasksLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <LoadingState label="Loading your Daily Tasks" />
    </Container>
  );
}
