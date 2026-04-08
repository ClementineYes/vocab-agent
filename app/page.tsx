import { redirect } from "next/navigation";

export default function Home() {
  // 移动端优先：默认直接进入“扫描”流程
  redirect("/scan");
}
