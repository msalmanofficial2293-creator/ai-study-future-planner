import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/feedback";

export default function FuturePlannerLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <LoadingState label="Loading your Future Planner" />
    </Container>
  );
}
