import { redirect } from "next/navigation";

/** One role chooser only: "Who is signing in?" lives at /sign-in. Old links to /welcome land there. */
export default function WelcomePage() {
  redirect("/sign-in");
}
