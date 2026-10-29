/** 站点内容的通用类型定义 */

export const LANGS = ["zh", "en", "fr"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  zh: "中文",
  en: "English",
  fr: "Français",
};

/** 一段三语文案 */
export type Loc = Record<Lang, string>;

export const EMPTY_LOC: Loc = { zh: "", en: "", fr: "" };

/** 把数据库里存的 JSON 字符串解析成 Loc，容错处理 */
export function parseLoc(raw: unknown): Loc {
  if (typeof raw !== "string" || raw.trim() === "") return { ...EMPTY_LOC };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return {
        zh: typeof v.zh === "string" ? v.zh : "",
        en: typeof v.en === "string" ? v.en : "",
        fr: typeof v.fr === "string" ? v.fr : "",
      };
    }
    if (typeof v === "string") return { zh: v, en: v, fr: v };
  } catch {
    // 不是 JSON，就当成三语相同的纯文本
    return { zh: raw, en: raw, fr: raw };
  }
  return { ...EMPTY_LOC };
}

export function stringifyLoc(loc: Loc): string {
  return JSON.stringify({ zh: loc.zh ?? "", en: loc.en ?? "", fr: loc.fr ?? "" });
}

/** 取某语言的文案，空则回退到其它语言，保证前台不会出现空白 */
export function pick(loc: Loc, lang: Lang): string {
  const order: Lang[] = [lang, "en", "zh", "fr"];
  for (const l of order) {
    const v = loc[l];
    if (v && v.trim() !== "") return v;
  }
  return "";
}

/** 多行文案按换行拆成数组，供 <br/> 渲染 */
export function lines(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter((s) => s !== "");
}
