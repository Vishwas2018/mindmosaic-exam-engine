import { connection } from "next/server";

import { EmailVerificationScreen } from "@/features/auth/components/EmailVerificationScreen";

export default async function EmailConfirmPage() {
  // useSearchParams needs the incoming request to render the right initial
  // screen. A static client-only shell hides the resend form until JS loads.
  await connection();
  return <EmailVerificationScreen />;
}
