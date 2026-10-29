import PasswordForm from "./form";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <>
      <div className="pageHead">
        <h1>账号设置</h1>
        <p>后台只有一个管理员账号，靠这一个密码登录。改完会立刻生效，其它设备上已登录的会话仍然有效。</p>
      </div>

      <div className="card" style={{ maxWidth: 460 }}>
        <h2>修改密码</h2>
        <p className="sub">新密码至少 8 位。</p>
        <PasswordForm />
      </div>
    </>
  );
}
