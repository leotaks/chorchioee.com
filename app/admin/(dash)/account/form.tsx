"use client";

import { useActionState } from "react";
import { changePassword, type LoginState } from "../../actions";
import { SaveButton } from "../../ui";

const initial: LoginState = {};

export default function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, initial);
  return (
    <form action={formAction}>
      <div className="field">
        <div className="fieldHead">
          <label>当前密码</label>
        </div>
        <input type="password" name="current" autoComplete="current-password" />
      </div>
      <div className="field">
        <div className="fieldHead">
          <label>新密码</label>
        </div>
        <input type="password" name="next" autoComplete="new-password" />
      </div>
      <div className="field">
        <div className="fieldHead">
          <label>再输一次新密码</label>
        </div>
        <input type="password" name="confirm" autoComplete="new-password" />
      </div>
      {state.error ? <p className="err">{state.error}</p> : null}
      {state.error === "" ? <p className="ok">密码已更新。</p> : null}
      <div className="actions">
        <SaveButton>修改密码</SaveButton>
      </div>
    </form>
  );
}
