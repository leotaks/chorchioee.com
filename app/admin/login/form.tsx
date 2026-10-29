"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import { SaveButton } from "../ui";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction] = useActionState(login, initial);
  return (
    <form action={formAction}>
      <div className="field">
        <div className="fieldHead">
          <label>管理员密码</label>
        </div>
        <input type="password" name="password" autoFocus autoComplete="current-password" />
      </div>
      {state.error ? <p className="err">{state.error}</p> : null}
      <SaveButton>登录</SaveButton>
    </form>
  );
}
