import { db, getSettingJSON } from "./db";
import { LANGS, type Lang, type Loc, EMPTY_LOC, parseLoc, pick, lines } from "./types";

/* ---------- 数据库行类型 ---------- */

export type SectionRow = {
  id: number;
  key: string;
  label: string;
  sort: number;
  published: number;
  eyebrow: string;
  title: string;
  title2: string;
  body: string;
  cta_label: string;
  cta_href: string;
  image: string;
  image2: string;
  video: string;
};

export type CardRow = {
  id: number;
  group_key: string;
  sort: number;
  published: number;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  image: string;
};

export type LineRow = {
  id: number;
  slug: string;
  sort: number;
  published: number;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  cta_label: string;
  cta_href: string;
  image: string;
};

export type ProductRow = {
  id: number;
  slug: string;
  line_id: number | null;
  sort: number;
  published: number;
  name: string;
  category: string;
  badge: string;
  body: string;
  price: string;
  image: string;
  href: string;
};

export type MediaRow = {
  id: number;
  url: string;
  title: string;
  alt: string;
  mime: string;
  size: number;
  builtin: number;
  created_at: number;
};

/* ---------- 读取 ---------- */

export function allSections(): SectionRow[] {
  return db().prepare("SELECT * FROM sections ORDER BY sort, id").all() as SectionRow[];
}

export function sectionByKey(key: string): SectionRow | undefined {
  return db().prepare("SELECT * FROM sections WHERE key = ?").get(key) as SectionRow | undefined;
}

export function cardsOf(group: string, onlyPublished = false): CardRow[] {
  const sql = onlyPublished
    ? "SELECT * FROM cards WHERE group_key = ? AND published = 1 ORDER BY sort, id"
    : "SELECT * FROM cards WHERE group_key = ? ORDER BY sort, id";
  return db().prepare(sql).all(group) as CardRow[];
}

export function allLines(onlyPublished = false): LineRow[] {
  const sql = onlyPublished
    ? "SELECT * FROM product_lines WHERE published = 1 ORDER BY sort, id"
    : "SELECT * FROM product_lines ORDER BY sort, id";
  return db().prepare(sql).all() as LineRow[];
}

export function lineById(id: number): LineRow | undefined {
  return db().prepare("SELECT * FROM product_lines WHERE id = ?").get(id) as LineRow | undefined;
}

export function allProducts(onlyPublished = false): ProductRow[] {
  const sql = onlyPublished
    ? "SELECT * FROM products WHERE published = 1 ORDER BY sort, id"
    : "SELECT * FROM products ORDER BY sort, id";
  return db().prepare(sql).all() as ProductRow[];
}

export function productById(id: number): ProductRow | undefined {
  return db().prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
}

export function allMedia(): MediaRow[] {
  return db()
    .prepare("SELECT * FROM media ORDER BY builtin ASC, created_at DESC, id DESC")
    .all() as MediaRow[];
}

/* ---------- 前台视图模型 ---------- */

export type PageData = {
  announce: string;
  announceEnabled: boolean;
  brand: { name: string; sub: string };
  edition: string;
  scrollCue: string;
  backToTop: string;
  nav: { label: string; href: string }[];
  hero: {
    show: boolean;
    eyebrow: string;
    titleLines: string[];
    body: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
    bg: string;
  };
  categories: { label: string; sub: string; href: string }[];
  manifesto: { show: boolean; eyebrow: string; titleLines: string[]; body: string; bg: string };
  icon: {
    show: boolean;
    eyebrow: string;
    label: string;
    titleLines: string[];
    body: string;
    ctaLabel: string;
    ctaHref: string;
    bg: string;
    poster: string;
    video: string;
  };
  lines: {
    id: number;
    number: string;
    eyebrow: string;
    titleLines: string[];
    body: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
  }[];
  newArrivals: { show: boolean; eyebrow: string; title: string; ctaLabel: string; ctaHref: string };
  products: {
    id: number;
    name: string;
    category: string;
    badge: string;
    price: string;
    image: string;
    href: string;
  }[];
  notes: {
    show: boolean;
    eyebrow: string;
    titleLines: string[];
    body: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
  };
  services: { id: number; eyebrow: string; title: string; body: string }[];
  subscribe: {
    show: boolean;
    titleLines: string[];
    label: string;
    placeholder: string;
    thanks: string;
  };
  footer: { links: string; copyright: string; icp: string };
  seo: { title: string; description: string };
};

export type SiteContent = {
  defaultLang: Lang;
  data: Record<Lang, PageData>;
};

const blankSection: SectionRow = {
  id: 0,
  key: "",
  label: "",
  sort: 0,
  published: 0,
  eyebrow: "{}",
  title: "{}",
  title2: "{}",
  body: "{}",
  cta_label: "{}",
  cta_href: "",
  image: "",
  image2: "",
  video: "",
};

export function getSiteContent(): SiteContent {
  const sections = new Map(allSections().map((s) => [s.key, s]));
  const nav = cardsOf("nav", true);
  const categories = cardsOf("category", true);
  const services = cardsOf("service", true);
  const lineRows = allLines(true);
  const productRows = allProducts(true);

  const announce = getSettingJSON<Loc>("announce", EMPTY_LOC);
  const announceEnabled = getSettingJSON<boolean>("announce_enabled", true);
  const brandName = getSettingJSON<string>("brand_name", "CHOR CHIOÉE");
  const brandSub = getSettingJSON<string>("brand_sub", "PARIS · SHANGHAI");
  const edition = getSettingJSON<string>("edition", "");
  const scrollCue = getSettingJSON<Loc>("scroll_cue", EMPTY_LOC);
  const backToTop = getSettingJSON<Loc>("back_to_top", EMPTY_LOC);
  const footerLinks = getSettingJSON<Loc>("footer_links", EMPTY_LOC);
  const copyright = getSettingJSON<string>("copyright", "");
  const icp = getSettingJSON<string>("icp", "");
  const seoTitle = getSettingJSON<Loc>("seo_title", EMPTY_LOC);
  const seoDesc = getSettingJSON<Loc>("seo_description", EMPTY_LOC);
  const defaultLangRaw = getSettingJSON<string>("default_lang", "en");
  const defaultLang: Lang = (LANGS as readonly string[]).includes(defaultLangRaw)
    ? (defaultLangRaw as Lang)
    : "en";

  const sec = (key: string): SectionRow => sections.get(key) ?? blankSection;

  const build = (lang: Lang): PageData => {
    const p = (raw: string) => pick(parseLoc(raw), lang);
    const hero = sec("hero");
    const manifesto = sec("manifesto");
    const icon = sec("icon");
    const newArrivals = sec("new_arrivals");
    const notes = sec("notes");
    const subscribe = sec("subscribe");

    return {
      announce: pick(announce, lang),
      announceEnabled,
      brand: { name: brandName, sub: brandSub },
      edition,
      scrollCue: pick(scrollCue, lang),
      backToTop: pick(backToTop, lang),
      nav: nav.map((c) => ({ label: p(c.title), href: c.href || "#" })),
      hero: {
        show: hero.published === 1,
        eyebrow: p(hero.eyebrow),
        titleLines: lines(p(hero.title)),
        body: p(hero.body),
        ctaLabel: p(hero.cta_label),
        ctaHref: hero.cta_href || "#new",
        image: hero.image,
        bg: hero.image2,
      },
      categories: categories.map((c) => ({
        label: p(c.title),
        sub: p(c.body),
        href: c.href || "#new",
      })),
      manifesto: {
        show: manifesto.published === 1,
        eyebrow: p(manifesto.eyebrow),
        titleLines: lines(p(manifesto.title)),
        body: p(manifesto.body),
        bg: manifesto.image,
      },
      icon: {
        show: icon.published === 1,
        eyebrow: p(icon.eyebrow),
        label: p(icon.title2),
        titleLines: lines(p(icon.title)),
        body: p(icon.body),
        ctaLabel: p(icon.cta_label),
        ctaHref: icon.cta_href || "#new",
        bg: icon.image,
        poster: icon.image2 || icon.image,
        video: icon.video,
      },
      lines: lineRows.map((l) => ({
        id: l.id,
        number: l.number,
        eyebrow: p(l.eyebrow),
        titleLines: lines(p(l.title)),
        body: p(l.body),
        ctaLabel: p(l.cta_label),
        ctaHref: l.cta_href || "#new",
        image: l.image,
      })),
      newArrivals: {
        show: newArrivals.published === 1,
        eyebrow: p(newArrivals.eyebrow),
        title: p(newArrivals.title),
        ctaLabel: p(newArrivals.cta_label),
        ctaHref: newArrivals.cta_href || "#all",
      },
      products: productRows.map((pr) => ({
        id: pr.id,
        name: p(pr.name),
        category: p(pr.category),
        badge: p(pr.badge),
        price: pr.price,
        image: pr.image,
        href: pr.href,
      })),
      notes: {
        show: notes.published === 1,
        eyebrow: p(notes.eyebrow),
        titleLines: lines(p(notes.title)),
        body: p(notes.body),
        ctaLabel: p(notes.cta_label),
        ctaHref: notes.cta_href || "#read",
        image: notes.image,
      },
      services: services.map((s) => ({
        id: s.id,
        eyebrow: p(s.eyebrow),
        title: p(s.title),
        body: p(s.body),
      })),
      subscribe: {
        show: subscribe.published === 1,
        titleLines: lines(p(subscribe.title)),
        label: p(subscribe.title2),
        placeholder: p(subscribe.body),
        thanks: p(subscribe.cta_label),
      },
      footer: { links: pick(footerLinks, lang), copyright, icp },
      seo: { title: pick(seoTitle, lang), description: pick(seoDesc, lang) },
    };
  };

  return {
    defaultLang,
    data: { zh: build("zh"), en: build("en"), fr: build("fr") },
  };
}
