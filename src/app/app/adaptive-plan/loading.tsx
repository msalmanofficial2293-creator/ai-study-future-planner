import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/feedback";

export default function AdaptivePlanLoading() {
  return (
    <Container className="py-12 sm:py-16">
      <LoadingState label="Loading your adaptive plan" />
    </Container>
  );
}