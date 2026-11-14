import Link from "next/link";
import { redirect } from "next/navigation";

// Behind the /parent layout's role gate; redirects to canonical /parent/account
export default function ParentSettingsPage() {
  redirect("/parent/account");
  return <Link href="/parent/account">Redirecting to account…</Link>;
}
