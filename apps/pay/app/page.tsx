import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to main Oryn site if someone visits pay.oryn.cc without a token
  redirect("https://oryn.cc");
}
