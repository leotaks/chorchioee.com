import { allMedia, allSections, type SectionRow } from "@/lib/content";
import { parseLoc } from "@/lib/types";
import { saveSection } from "../../actions";
import { Collapsible, LocField, MediaField, SaveButton, TextField } from "../../ui";

export const dynamic = "force-dynamic";

type FieldSpec = {
  eyebrow?: string;
  title?: string;
  titleRows?: number;
  title2?: string;
  body?: string;
  bodyRows?: number;
  cta?: string;
  image?: string;
  image2?: string;
  video?: string;
  titleHint?: string;
};

const SPECS: Record<string, FieldSpec> = {
  hero: {
    eyebrow: "小标签（图上一行小字）",
    title: "主标题",
    titleRows: 3,
    titleHint: "换行就是页面上的换行。例：美好，↵在发生之前。",
    body: "正文",
    bodyRows: 3,
    cta: "按钮",
    image: "人像图（叠在背景之上）",
    image2: "背景大图",
  },
  manifesto: {
    eyebrow: "编号标签",
    title: "宣言（会自动加上引号）",
    titleRows: 3,
    body: "正文",
    bodyRows: 4,
    image: "背景图",
  },
  icon: {
    eyebrow: "编号标签",
    title2: "画面左下角标签",
    title: "标题（每行独立入场动画）",
    titleRows: 3,
    body: "正文",
    bodyRows: 3,
    cta: "按钮",
    image: "画面背景图",
    image2: "视频封面图",
    video: "背景视频",
  },
  new_arrivals: {
    eyebrow: "编号标签",
    title: "栏目标题",
    titleRows: 1,
    cta: "右上角链接",
  },
  notes: {
    eyebrow: "编号标签",
    title: "标题",
    titleRows: 3,
    body: "正文",
    bodyRows: 4,
    cta: "按钮",
    image: "配图",
  },
  subscribe: {
    title: "标题",
    titleRows: 3,
    title2: "表单上方小标签",
    body: "输入框提示文字",
    bodyRows: 1,
    cta: "提交后的致谢语",
  },
};

export default function SectionsPage() {
  const sections = allSections();
  const media = allMedia().map((m) => ({ id: m.id, url: m.url, title: m.title, mime: m.mime }));

  return (
    <>
      <div className="pageHead">
        <h1>首页模块</h1>
        <p>
          首页从上到下的各个区块。关掉「显示」开关即可整块隐藏，不会删数据。图片可以直接填地址，
          也可以点「从媒体库选择」。
        </p>
      </div>

      {sections.map((s) => (
        <Collapsible
          key={s.id}
          title={s.label || s.key}
          subtitle={s.published ? "显示中" : "已隐藏"}
        >
          <SectionForm section={s} media={media} />
        </Collapsible>
      ))}
    </>
  );
}

function SectionForm({
  section: s,
  media,
}: {
  section: SectionRow;
  media: { id: number; url: string; title: string; mime: string }[];
}) {
  const spec = SPECS[s.key] ?? {};
  return (
    <form action={saveSection}>
      <input type="hidden" name="id" value={s.id} />

      <label className="check" style={{ marginBottom: 18 }}>
        <input type="checkbox" name="published" defaultChecked={s.published === 1} />
        在首页显示这一块
      </label>

      {spec.eyebrow ? (
        <LocField name="eyebrow" label={spec.eyebrow} value={parseLoc(s.eyebrow)} />
      ) : null}

      {spec.title2 ? (
        <LocField name="title2" label={spec.title2} value={parseLoc(s.title2)} />
      ) : null}

      {spec.title ? (
        <LocField
          name="title"
          label={spec.title}
          value={parseLoc(s.title)}
          rows={spec.titleRows ?? 2}
          hint={spec.titleHint}
        />
      ) : null}

      {spec.body ? (
        <LocField name="body" label={spec.body} value={parseLoc(s.body)} rows={spec.bodyRows ?? 3} />
      ) : null}

      {spec.cta ? (
        <div className="cols2">
          <LocField name="cta_label" label={`${spec.cta}文字`} value={parseLoc(s.cta_label)} />
          <TextField
            name="cta_href"
            label={`${spec.cta}链接`}
            value={s.cta_href}
            placeholder="#new"
            hint="站内锚点用 #new / #collections，外链填完整网址"
          />
        </div>
      ) : (
        <input type="hidden" name="cta_href" value={s.cta_href} />
      )}

      {!spec.cta ? (
        <>
          <input type="hidden" name="cta_label.zh" value={parseLoc(s.cta_label).zh} />
          <input type="hidden" name="cta_label.en" value={parseLoc(s.cta_label).en} />
          <input type="hidden" name="cta_label.fr" value={parseLoc(s.cta_label).fr} />
        </>
      ) : null}

      {spec.image ? (
        <MediaField name="image" label={spec.image} value={s.image} media={media} />
      ) : (
        <input type="hidden" name="image" value={s.image} />
      )}

      {spec.image2 ? (
        <MediaField name="image2" label={spec.image2} value={s.image2} media={media} />
      ) : (
        <input type="hidden" name="image2" value={s.image2} />
      )}

      {spec.video ? (
        <MediaField name="video" label={spec.video} value={s.video} media={media} video />
      ) : (
        <input type="hidden" name="video" value={s.video} />
      )}

      {/* 未使用的三语字段原样带回，避免保存时被清空 */}
      {!spec.eyebrow ? <HiddenLoc name="eyebrow" raw={s.eyebrow} /> : null}
      {!spec.title ? <HiddenLoc name="title" raw={s.title} /> : null}
      {!spec.title2 ? <HiddenLoc name="title2" raw={s.title2} /> : null}
      {!spec.body ? <HiddenLoc name="body" raw={s.body} /> : null}

      <div className="actions">
        <SaveButton />
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
