"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LANGS, LANG_LABELS, type Lang, type Loc } from "@/lib/types";

/* ---------- 保存按钮 ---------- */

export function SaveButton({ children = "保存" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn primary" disabled={pending}>
      {pending ? "保存中…" : children}
    </button>
  );
}

/* ---------- 三语输入 ---------- */

export function LocField({
  name,
  label,
  value,
  rows = 0,
  hint,
}: {
  name: string;
  label: string;
  value: Loc;
  rows?: number;
  hint?: string;
}) {
  const [tab, setTab] = useState<Lang>("zh");
  return (
    <div className="field">
      <div className="fieldHead">
        <label>{label}</label>
        <div className="tabs">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className={tab === l ? "on" : ""}
              onClick={() => setTab(l)}
              title={LANG_LABELS[l]}
            >
              {l === "zh" ? "中" : l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {LANGS.map((l) =>
        rows > 0 ? (
          <textarea
            key={l}
            name={`${name}.${l}`}
            defaultValue={value[l]}
            rows={rows}
            hidden={tab !== l}
          />
        ) : (
          <input key={l} name={`${name}.${l}`} defaultValue={value[l]} hidden={tab !== l} />
        ),
      )}
      {hint ? <small className="hint">{hint}</small> : null}
    </div>
  );
}

/* ---------- 单行普通输入 ---------- */

export function TextField({
  name,
  label,
  value,
  hint,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <div className="fieldHead">
        <label>{label}</label>
      </div>
      <input name={name} defaultValue={value} placeholder={placeholder} />
      {hint ? <small className="hint">{hint}</small> : null}
    </div>
  );
}

/* ---------- 图片 / 视频选择 ---------- */

export type MediaOption = { id: number; url: string; title: string; mime: string };

export function MediaField({
  name,
  label,
  value,
  media,
  hint,
  video = false,
}: {
  name: string;
  label: string;
  value: string;
  media: MediaOption[];
  hint?: string;
  video?: boolean;
}) {
  const [url, setUrl] = useState(value);
  const [open, setOpen] = useState(false);
  const list = media.filter((m) =>
    video ? m.mime.startsWith("video") : !m.mime.startsWith("video"),
  );

  return (
    <div className="field">
      <div className="fieldHead">
        <label>{label}</label>
      </div>
      <div className="mediaRow">
        <div className="thumb">
          {url ? (
            video ? (
              <video src={url} muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" />
            )
          ) : (
            <span>无</span>
          )}
        </div>
        <div className="mediaCtrl">
          <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="row">
            <button type="button" className="btn" onClick={() => setOpen((v) => !v)}>
              {open ? "收起素材" : "从媒体库选择"}
            </button>
            {url ? (
              <button type="button" className="btn ghost" onClick={() => setUrl("")}>
                清空
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {open ? (
        <div className="picker">
          {list.map((m) => (
            <button
              key={m.id}
              type="button"
              className={m.url === url ? "pickItem on" : "pickItem"}
              onClick={() => {
                setUrl(m.url);
                setOpen(false);
              }}
              title={m.title || m.url}
            >
              {m.mime.startsWith("video") ? (
                <video src={m.url} muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" />
              )}
              <span>{m.title || m.url}</span>
            </button>
          ))}
          {list.length === 0 ? <p className="hint">媒体库里还没有{video ? "视频" : "图片"}。</p> : null}
        </div>
      ) : null}
      {hint ? <small className="hint">{hint}</small> : null}
    </div>
  );
}

/* ---------- 两步确认的删除 ---------- */

export function ConfirmButton({
  action,
  label = "删除",
  confirmLabel = "确认删除？",
}: {
  action: (fd: FormData) => Promise<void>;
  label?: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  // 两个要点：
  // 1) 这里不能再套一个 <form>，否则会和外层表单嵌套，HTML 非法且导致水合失败；
  //    直接用外层表单的 submit + formAction，外层表单里已经有 id 隐藏字段。
  // 2) 必须给两种状态的按钮不同的 key 并 preventDefault。否则 React 会复用同一个
  //    DOM 节点、只把 type 从 button 改成 submit，浏览器接着执行这次点击的默认行为，
  //    一下就把表单提交了（等于点一次就直接删）。
  if (!armed) {
    return (
      <button
        key="arm"
        type="button"
        className="btn ghost"
        onClick={(e) => {
          e.preventDefault();
          setArmed(true);
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <>
      <button key="confirm" type="submit" formAction={action} className="btn danger">
        {confirmLabel}
      </button>
      <button
        key="cancel"
        type="button"
        className="btn ghost"
        onClick={(e) => {
          e.preventDefault();
          setArmed(false);
        }}
      >
        取消
      </button>
    </>
  );
}

/* ---------- 上传 ---------- */

export function Uploader({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [names, setNames] = useState<string[]>([]);
  return (
    <form action={action} className="uploader">
      <input
        type="file"
        name="file"
        multiple
        accept="image/*,video/mp4,video/webm"
        onChange={(e) => setNames([...(e.target.files ?? [])].map((f) => f.name))}
      />
      <SaveButton>上传</SaveButton>
      {names.length > 0 ? <small className="hint">已选择：{names.join("、")}</small> : null}
    </form>
  );
}

/* ---------- 折叠面板 ---------- */

export function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="panel">
      <button type="button" className="panelHead" onClick={() => setOpen((v) => !v)}>
        <span>
          <b>{title}</b>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
        <i>{open ? "−" : "+"}</i>
      </button>
      {open ? <div className="panelBody">{children}</div> : null}
    </section>
  );
}
