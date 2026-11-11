import { redirect } from "next/navigation";

// Behind the /parent layout's role gate; redirects to canonical /parent/account
export default function ParentSettingsPage() {
  redirect("/parent/account");
}
