import { cardsOf, type CardRow } from "@/lib/content";
import { EMPTY_LOC, parseLoc, pick } from "@/lib/types";
import { deleteCard, moveCard, saveCard } from "../../actions";
import { Collapsible, ConfirmButton, LocField, SaveButton, TextField } from "../../ui";

export const dynamic = "force-dynamic";

type Spec = {
  group: string;
  heading: string;
  note: string;
  eyebrow?: string;
  title: string;
  body?: string;
  bodyHint?: string;
  href?: string;
};

const GROUPS: Spec[] = [
  {
    group: "nav",
    heading: "顶部导航",
    note: "页面最上方的菜单项，链接用 #new / #collections / #story / #service 这样的站内锚点。",
    title: "菜单文字",
    href: "链接",
  },
  {
    group: "category",
    heading: "分类横条",
    note: "首图下方的一条分类导航。每项有一个主文字和一行英文小字。",
    title: "分类名",
    body: "下方小字",
    bodyHint: "例：NECKLACES",
    href: "链接",
  },
  {
    group: "service",
    heading: "服务说明",
    note: "页面底部的三项服务。",
    eyebrow: "编号标签",
    title: "服务名",
    body: "说明文字",
  },
];

export default function TextsPage() {
  return (
    <>
      <div className="pageHead">
        <h1>导航与服务</h1>
        <p>顶部菜单、分类横条、底部服务三块的文字，都在这里改。</p>
      </div>

      {GROUPS.map((spec) => (
        <div className="card" key={spec.group}>
          <h2>{spec.heading}</h2>
          <p className="sub">{spec.note}</p>
          <Group spec={spec} items={cardsOf(spec.group)} />
        </div>
      ))}
    </>
  );
}

function Group({ spec, items }: { spec: Spec; items: CardRow[] }) {
  return (
    <>
      {items.map((c, i) => (
        <div key={c.id}>
          <div className="row" style={{ justifyContent: "flex-end", marginBottom: -6 }}>
            <form action={moveCard} className="inlineForm">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="group_key" value={spec.group} />
              <input type="hidden" name="dir" value={-1} />
              <button className="btn tiny ghost" disabled={i === 0}>
                ↑
              </button>
            </form>
            <form action={moveCard} className="inlineForm">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="group_key" value={spec.group} />
              <input type="hidden" name="dir" value={1} />
              <button className="btn tiny ghost" disabled={i === items.length - 1}>
                ↓
              </button>
            </form>
          </div>
          <Collapsible
            title={pick(parseLoc(c.title), "zh") || `第 ${i + 1} 项`}
            subtitle={c.published ? "显示中" : "已隐藏"}
          >
            <CardForm spec={spec} card={c} />
          </Collapsible>
        </div>
      ))}

      <Collapsible title="＋ 新增一项">
        <CardForm spec={spec} card={null} />
      </Collapsible>
    </>
  );
}

function CardForm({ spec, card: c }: { spec: Spec; card: CardRow | null }) {
  return (
    <form action={saveCard}>
      <input type="hidden" name="id" value={c?.id ?? 0} />
      <input type="hidden" name="group_key" value={spec.group} />
      <input type="hidden" name="image" value={c?.image ?? ""} />

      <label className="check" style={{ marginBottom: 16 }}>
        <input type="checkbox" name="published" defaultChecked={c ? c.published === 1 : true} />
        显示
      </label>

      {spec.eyebrow ? (
        <LocField name="eyebrow" label={spec.eyebrow} value={c ? parseLoc(c.eyebrow) : EMPTY_LOC} />
      ) : (
        <HiddenLoc name="eyebrow" raw={c?.eyebrow ?? ""} />
      )}

      <LocField name="title" label={spec.title} value={c ? parseLoc(c.title) : EMPTY_LOC} />

      {spec.body ? (
        <LocField
          name="body"
          label={spec.body}
          value={c ? parseLoc(c.body) : EMPTY_LOC}
          rows={spec.group === "service" ? 3 : 0}
          hint={spec.bodyHint}
        />
      ) : (
        <HiddenLoc name="body" raw={c?.body ?? ""} />
      )}

      {spec.href ? (
        <TextField name="href" label={spec.href} value={c?.href ?? ""} placeholder="#new" />
      ) : (
        <input type="hidden" name="href" value={c?.href ?? ""} />
      )}

      <div className="actions">
        <SaveButton />
        {c ? <ConfirmButton action={deleteCard} label="删除" /> : null}
      </div>
    </form>
  );
}

function HiddenLoc({ name, raw }: { name: string; raw: string }) {
  const v = parseLoc(raw);
  return (
    <>
      <input type="hidden" name={`${name}.zh`} value={v.zh} />
      <input type="hidden" name={`${name}.en`} value={v.en} />
      <input type="hidden" name={`${name}.fr`} value={v.fr} />
    </>
  );
}
