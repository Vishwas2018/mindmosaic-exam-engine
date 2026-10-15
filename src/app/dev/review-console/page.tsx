import { notFound } from "next/navigation";
import { ReviewConsole } from "@/features/review-console/components/ReviewConsole";
import { isReviewConsoleAllowed } from "@/features/review-console/preview-gate";

export default function ReviewConsolePage() {
  if (!isReviewConsoleAllowed()) notFound();

  return <ReviewConsole />;
}
