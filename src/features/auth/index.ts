export { AuthProvider, useAuth } from "./AuthProvider";
export type {
  AuthContextValue,
  AuthResult,
  AuthStatus,
  EmailConfirmResult,
  OAuthProvider,
} from "./AuthProvider";
export { AuthCard } from "./components/AuthCard";
export { AuthBrandPanel } from "./components/AuthBrandPanel";
export { AuthNav } from "./components/AuthNav";
export { EmailConfirmationPending } from "./components/EmailConfirmationPending";
export { EmailVerificationScreen } from "./components/EmailVerificationScreen";
export { StudentSignInCard } from "./components/StudentSignInCard";
export { evaluatePassword, PASSWORD_RULES } from "./password";
export {
  ROLE_HOME_LABELS,
  ROLE_HOME_PATHS,
  isProfileRole,
  roleHomeLabel,
  roleHomePath,
} from "./roles";
export type { ProfileRole, SignUpRole } from "./roles";
export {
  buildAliasEmail,
  formatLoginCode,
  generateLoginCode,
  generatePin,
  isValidPin,
  normalizeLoginCode,
} from "./student-alias";
/*
 * provisionChild (./provision-child.ts) is deliberately NOT re-exported from
 * this barrel. It's a "use server" action guarded by `import "server-only"`;
 * this barrel is imported by "use client" components (AuthCard, AuthNav),
 * and mixing a server-only module into that shared graph risks exactly the
 * client-bundle leak D1 forbids. Import it directly from
 * "@/features/auth/provision-child" instead.
 */
