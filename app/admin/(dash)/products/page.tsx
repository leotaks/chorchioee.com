import { allLines, allMedia, allProducts, type LineRow, type ProductRow } from "@/lib/content";
import { EMPTY_LOC, parseLoc, pick } from "@/lib/types";
import { deleteProduct, moveProduct, saveProduct } from "../../actions";
import { Collapsible, ConfirmButton, LocField, MediaField, SaveButton, TextField } from "../../ui";

export const dynamic = "force-dynamic";

type MediaOpt = { id: number; url: string; title: string; mime: string };

export default function ProductsPage() {
  const products = allProducts();
  const lines = allLines();
  const media = allMedia().map((m) => ({ id: m.id, url: m.url, title: m.title, mime: m.mime }));

  return (
    <>
      <div className="pageHead">
        <h1>产品</h1>
        <p>首页「新近抵达」栏里的单品。顺序就是展示顺序，前四件的版式最完整，建议保持 4 的倍数。</p>
      </div>

      {products.map((p, i) => (
        <div key={p.id}>
          <div className="row" style={{ justifyContent: "flex-end", marginBottom: -6 }}>
            <form action={moveProduct} className="inlineForm">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="dir" value={-1} />
              <button className="btn tiny ghost" disabled={i === 0}>
                ↑ 上移
              </button>
            </form>
            <form action={moveProduct} className="inlineForm">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="dir" value={1} />
              <button className="btn tiny ghost" disabled={i === products.length - 1}>
                ↓ 下移
              </button>
            </form>
          </div>
          <Collapsible
            title={pick(parseLoc(p.name), "zh") || p.slug}
            subtitle={`${p.price || "未填价格"} · ${p.published ? "上架中" : "已下架"}`}
          >
            <ProductForm product={p} lines={lines} media={media} />
          </Collapsible>
        </div>
      ))}

      <Collapsible title="＋ 新建产品" subtitle="填好后保存即可出现在首页">
        <ProductForm product={null} lines={lines} media={media} />
      </Collapsible>
    </>
  );
}

function ProductForm({
  product: p,
  lines,
  media,
}: {
  product: ProductRow | null;
  lines: LineRow[];
  media: MediaOpt[];
}) {
  return (
    <form action={saveProduct}>
      <input type="hidden" name="id" value={p?.id ?? 0} />

      <label className="check" style={{ marginBottom: 18 }}>
        <input type="checkbox" name="published" defaultChecked={p ? p.published === 1 : true} />
        上架（在首页显示）
      </label>

      <LocField name="name" label="产品名" value={p ? parseLoc(p.name) : EMPTY_LOC} />
      <LocField
        name="category"
        label="品类（名字下方一行小字）"
        value={p ? parseLoc(p.category) : EMPTY_LOC}
        hint="例：戒指 / Ring / Bague"
      />
      <LocField
        name="badge"
        label="图上角标"
        value={p ? parseLoc(p.badge) : EMPTY_LOC}
        hint="例：925 银 · 镀金，或 畅销"
      />

      <div className="cols2">
        <TextField
          name="price"
          label="价格"
          value={p?.price ?? ""}
          placeholder="¥860"
          hint="原样显示，含货币符号"
        />
        <div className="field">
          <div className="fieldHead">
            <label>所属产品线</label>
          </div>
          <select name="line_id" defaultValue={String(p?.line_id ?? "")}>
            <option value="">不归属任何产品线</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {pick(parseLoc(l.title), "zh").replace(/\n/g, " ") || l.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="cols2">
        <TextField
          name="slug"
          label="英文标识（网址用）"
          value={p?.slug ?? ""}
          placeholder="留空自动生成"
        />
        <TextField
          name="href"
          label="详情页链接"
          value={p?.href ?? ""}
          placeholder="留空则产品名不可点击"
          hint="可填天猫 / 京东 / 得物的商品链接"
        />
      </div>

      <LocField name="body" label="产品描述（暂不显示在首页，先存着）" value={p ? parseLoc(p.body) : EMPTY_LOC} rows={3} />

      <MediaField
        name="image"
        label="产品图"
        value={p?.image ?? ""}
        media={media}
        hint="建议正方形，短边不低于 1200px"
      />

      <div className="actions">
        <SaveButton />
        {p ? <ConfirmButton action={deleteProduct} label="删除这件产品" /> : null}
      </div>
    </form>
  );
}
