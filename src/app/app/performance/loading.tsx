import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/feedback";

export default function PerformanceLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <LoadingState label="Loading your performance" />
    </Container>
  );
}