import { redirect } from "next/navigation";

export default function PlayTicTacToeOnlinePage() {
  redirect("/online?game=tictactoe");
}
