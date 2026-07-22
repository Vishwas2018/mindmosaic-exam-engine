/**
 * The student-session mechanism, kept separate from parent/teacher/admin
 * auth because it is genuinely a different login model (D1: login code +
 * PIN, no email field — see src/features/auth/student-alias.ts and
 * src/features/auth/components/StudentSignInCard.tsx), even though both
 * ultimately call GoTrue's password grant. This is the one place that
 * mirrors the code -> alias-email reconstruction a real student sign-in
 * performs, so a test exercising this path is exercising the real
 * mechanism, not a shortcut around it.
 */
import { studentAliasEmail } from "./identities";
import { signInWithPassword, type FixtureSession } from "./session-cookie";

/** What a parent hands a child: a login code and a PIN. Never an email. */
export interface StudentCredentials {
  readonly loginCode: string;
  readonly pin: string;
}

export async function signInAsStudent(
  credentials: StudentCredentials,
): Promise<FixtureSession> {
  const email = studentAliasEmail(credentials.loginCode);
  return signInWithPassword(email, credentials.pin);
}
