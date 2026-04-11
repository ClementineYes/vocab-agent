import { redirect } from "next/navigation";

export default function Home() {
  // 默认首页：阅览
  redirect("/reading");
}
