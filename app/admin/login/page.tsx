import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import LoginForm from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/admin");
  return (
    <div className="loginWrap">
      <div className="loginCard">
        <h1>CHOR CHIOÉE</h1>
        <small>内容管理后台</small>
        <LoginForm />
      </div>
    </div>
  );
}
