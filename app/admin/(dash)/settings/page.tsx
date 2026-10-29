import { getSettingJSON } from "@/lib/db";
import { EMPTY_LOC, LANG_LABELS, LANGS, type Loc } from "@/lib/types";
import { saveSettings } from "../../actions";
import { LocField, SaveButton, TextField } from "../../ui";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const announce = getSettingJSON<Loc>("announce", EMPTY_LOC);
  const announceEnabled = getSettingJSON<boolean>("announce_enabled", true);
  const brandName = getSettingJSON<string>("brand_name", "");
  const brandSub = getSettingJSON<string>("brand_sub", "");
  const edition = getSettingJSON<string>("edition", "");
  const scrollCue = getSettingJSON<Loc>("scroll_cue", EMPTY_LOC);
  const backToTop = getSettingJSON<Loc>("back_to_top", EMPTY_LOC);
  const footerLinks = getSettingJSON<Loc>("footer_links", EMPTY_LOC);
  const copyright = getSettingJSON<string>("copyright", "");
  const icp = getSettingJSON<string>("icp", "");
  const defaultLang = getSettingJSON<string>("default_lang", "en");
  const seoTitle = getSettingJSON<Loc>("seo_title", EMPTY_LOC);
  const seoDesc = getSettingJSON<Loc>("seo_description", EMPTY_LOC);

  return (
    <>
      <div className="pageHead">
        <h1>站点设置</h1>
        <p>品牌名、顶部公告条、页脚、备案号和搜索引擎信息。</p>
      </div>

      <form action={saveSettings}>
        <div className="card">
          <h2>顶部公告条</h2>
          <p className="sub">页面最顶端那一行深色小字。</p>
          <label className="check" style={{ marginBottom: 16 }}>
            <input type="checkbox" name="announce_enabled" defaultChecked={announceEnabled} />
            显示公告条
          </label>
          <LocField name="announce" label="公告文字" value={announce} />
        </div>

        <div className="card">
          <h2>品牌标识</h2>
          <div className="cols2">
            <TextField name="brand_name" label="品牌名（页头正中）" value={brandName} />
            <TextField name="brand_sub" label="品牌名下方小字" value={brandSub} />
          </div>
          <TextField
            name="edition"
            label="首图右侧竖排文字"
            value={edition}
            placeholder="ÉDITION 01 — 2026"
            hint="留空则不显示"
          />
        </div>

        <div className="card">
          <h2>界面文字</h2>
          <div className="cols2">
            <LocField name="scroll_cue" label="首图底部滚动提示" value={scrollCue} />
            <LocField name="back_to_top" label="回到顶部按钮" value={backToTop} />
          </div>
        </div>

        <div className="card">
          <h2>页脚</h2>
          <LocField
            name="footer_links"
            label="页脚链接文字"
            value={footerLinks}
            hint="目前是纯文字，条目之间用全角空格分隔"
          />
          <div className="cols2">
            <TextField name="copyright" label="版权信息" value={copyright} />
            <TextField
              name="icp"
              label="ICP 备案号"
              value={icp}
              placeholder="沪ICP备XXXXXXXX号-1"
              hint="填了才会显示在页脚，并自动链到工信部备案系统"
            />
          </div>
        </div>

        <div className="card">
          <h2>语言与 SEO</h2>
          <div className="field">
            <div className="fieldHead">
              <label>访客第一次进来时的默认语言</label>
            </div>
            <select name="default_lang" defaultValue={defaultLang}>
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANG_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <LocField name="seo_title" label="网页标题" value={seoTitle} />
          <LocField name="seo_description" label="网页描述" value={seoDesc} rows={3} />
        </div>

        <div className="actions">
          <SaveButton>保存全部设置</SaveButton>
        </div>
      </form>
    </>
  );
}
