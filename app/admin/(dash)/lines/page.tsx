import { allMedia, allLines, type LineRow } from "@/lib/content";
import { EMPTY_LOC, parseLoc, pick } from "@/lib/types";
import { deleteLine, moveLine, saveLine } from "../../actions";
import { Collapsible, ConfirmButton, LocField, MediaField, SaveButton, TextField } from "../../ui";

export const dynamic = "force-dynamic";

type MediaOpt = { id: number; url: string; title: string; mime: string };

export default function LinesPage() {
  const lines = allLines();
  const media = allMedia().map((m) => ({ id: m.id, url: m.url, title: m.title, mime: m.mime }));

  return (
    <>
      <div className="pageHead">
        <h1>产品线</h1>
        <p>
          首页中段的整屏大图系列。顺序就是页面上的顺序，配图为整屏背景，标题建议 2 行、每行 1–2 个词。
        </p>
      </div>

      {lines.map((l, i) => {
        const title = pick(parseLoc(l.title), "zh").replace(/\n/g, " ");
        return (
          <div key={l.id}>
            <div className="row" style={{ justifyContent: "flex-end", marginBottom: -6 }}>
              <form action={moveLine} className="inlineForm">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="dir" value={-1} />
                <button className="btn tiny ghost" disabled={i === 0}>
                  ↑ 上移
                </button>
              </form>
              <form action={moveLine} className="inlineForm">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="dir" value={1} />
                <button className="btn tiny ghost" disabled={i === lines.length - 1}>
                  ↓ 下移
                </button>
              </form>
            </div>
            <Collapsible
              title={`${l.number ? l.number + " · " : ""}${title || l.slug}`}
              subtitle={l.published ? "显示中" : "已隐藏"}
            >
              <LineForm line={l} media={media} />
            </Collapsible>
          </div>
        );
      })}

      <Collapsible title="＋ 新建产品线" subtitle="填好后保存即可出现在首页">
        <LineForm line={null} media={media} />
      </Collapsible>
    </>
  );
}

function LineForm({ line: l, media }: { line: LineRow | null; media: MediaOpt[] }) {
  return (
    <form action={saveLine}>
      <input type="hidden" name="id" value={l?.id ?? 0} />

      <label className="check" style={{ marginBottom: 18 }}>
        <input type="checkbox" name="published" defaultChecked={l ? l.published === 1 : true} />
        在首页显示
      </label>

      <div className="cols2">
        <TextField
          name="number"
          label="右下角编号"
          value={l?.number ?? ""}
          placeholder="01"
        />
        <TextField
          name="slug"
          label="英文标识（网址用）"
          value={l?.slug ?? ""}
          placeholder="留空自动生成"
        />
      </div>

      <LocField name="eyebrow" label="小标签" value={parseLoc(l?.eyebrow ?? "")} />
      <LocField
        name="title"
        label="系列名"
        value={l ? parseLoc(l.title) : EMPTY_LOC}
        rows={3}
        hint="换行就是页面上的换行，建议 2 行"
      />
      <LocField name="body" label="系列描述" value={l ? parseLoc(l.body) : EMPTY_LOC} rows={3} />

      <div className="cols2">
        <LocField name="cta_label" label="按钮文字" value={l ? parseLoc(l.cta_label) : EMPTY_LOC} />
        <TextField name="cta_href" label="按钮链接" value={l?.cta_href ?? "#new"} placeholder="#new" />
      </div>

      <MediaField
        name="image"
        label="整屏背景图"
        value={l?.image ?? ""}
        media={media}
        hint="横图效果最好，短边建议不低于 1600px"
      />

      <div className="actions">
        <SaveButton />
        {l ? <ConfirmButton action={deleteLine} label="删除这条产品线" /> : null}
      </div>
    </form>
  );
}
