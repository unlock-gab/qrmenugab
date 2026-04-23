import { redirect } from "next/navigation";

export default function OldLoginRedirect() {
  redirect("/merchant/login");
}
