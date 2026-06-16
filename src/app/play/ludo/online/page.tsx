import { redirect } from "next/navigation";

export default function PlayLudoOnlinePage() {
  redirect("/online?game=ludo");
}
