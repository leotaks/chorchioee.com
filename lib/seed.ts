import type Database from "better-sqlite3";
import { hashPassword } from "./password";
import type { Loc } from "./types";

const L = (zh: string, en: string, fr: string): string => JSON.stringify({ zh, en, fr });
/** 三语暂时相同（多为编号、标签一类） */
const S = (v: string): string => JSON.stringify({ zh: v, en: v, fr: v } as Loc);

/** 内置素材：项目 public/ 目录里原有的图片与视频，后台可直接选用 */
const BUILTIN_MEDIA: Array<[url: string, title: string, mime: string]> = [
  ["/hero-muse-editorial.png", "首页主视觉 · 人像", "image/png"],
  ["/chorchioee-butterfly-campaign-v2.png", "蝴蝶大片 · 通用底图", "image/png"],
  ["/manifesto-floral-shadow.webp", "宣言区 · 花影底图", "image/webp"],
  ["/butterfly-at-rest.webp", "系列 01 · 心蝶静伏", "image/webp"],
  ["/between-the-stars.webp", "系列 02 · 星与星之间", "image/webp"],
  ["/open-ampersand.webp", "系列 03 · 敞开的连字符", "image/webp"],
  ["/new-arrivals-double-arc.webp", "新品 · Double Arc 戒指", "image/webp"],
  ["/new-arrivals-earrings.webp", "新品 · Éclosion 耳饰", "image/webp"],
  ["/new-arrivals-necklace.webp", "新品 · Lueur 项链", "image/webp"],
  ["/new-arrivals-bracelet.webp", "新品 · Silence 手链", "image/webp"],
  ["/hero-film.mp4", "首页影片", "video/mp4"],
  ["/icon-film.mp4", "Icon 区影片", "video/mp4"],
];

export function seedIfEmpty(conn: Database.Database): void {
  const already = conn.prepare("SELECT COUNT(*) AS n FROM sections").get() as { n: number };
  if (already.n > 0) return;

  const now = Date.now();
  const tx = conn.transaction(() => {
    /* ---------- 媒体库：内置素材 ---------- */
    const insMedia = conn.prepare(
      `INSERT OR IGNORE INTO media (url, title, alt, mime, size, builtin, created_at)
       VALUES (?, ?, '{}', ?, 0, 1, ?)`,
    );
    for (const [url, title, mime] of BUILTIN_MEDIA) insMedia.run(url, title, mime, now);

    /* ---------- 全局设置 ---------- */
    const setting = conn.prepare(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
    );
    const put = (k: string, v: unknown) => setting.run(k, JSON.stringify(v), now);

    put("announce", {
      zh: "中国大陆地区免费配送 · 七天居家试戴",
      en: "COMPLIMENTARY SHIPPING ACROSS CHINA · SEVEN-DAY AT-HOME TRY-ON",
      fr: "LIVRAISON OFFERTE EN CHINE · ESSAI À DOMICILE PENDANT SEPT JOURS",
    });
    put("announce_enabled", true);
    put("brand_name", "CHOR CHIOÉE");
    put("brand_sub", "PARIS · SHANGHAI");
    put("edition", "ÉDITION 01 — 2026");
    put("scroll_cue", { zh: "向下", en: "SCROLL", fr: "DÉFILER" });
    put("back_to_top", { zh: "返回顶部", en: "BACK TO TOP", fr: "HAUT DE PAGE" });
    put("footer_links", {
      zh: "配送与退换　珠宝养护　尺寸指南",
      en: "SHIPPING & RETURNS　JEWELLERY CARE　SIZE GUIDE",
      fr: "LIVRAISON & RETOURS　ENTRETIEN　GUIDE DES TAILLES",
    });
    put("copyright", "© 2026 · SHANGHAI / PARIS");
    put("default_lang", "en");
    put("seo_title", {
      zh: "杜蔻 Chor Chioée — 见证正在发生",
      en: "Chor Chioée — Witness the Becoming",
      fr: "Chor Chioée — Témoin du devenir",
    });
    put("seo_description", {
      zh: "根植于法国独立首饰设计精神的彩色宝石蝴蝶珠宝，陪伴当代女性安静地成为自己。",
      en: "Independent jewellery for the quiet, ongoing act of becoming.",
      fr: "Joaillerie indépendante pour l’acte silencieux et continu du devenir.",
    });
    put("icp", "");
    setting.run("admin_password", JSON.stringify(hashPassword(process.env.ADMIN_PASSWORD || "chorchioee")), now);
    put("admin_password_is_default", !process.env.ADMIN_PASSWORD);

    /* ---------- 首页模块 ---------- */
    const insSection = conn.prepare(
      `INSERT INTO sections (key, label, sort, published, eyebrow, title, title2, body, cta_label, cta_href, image, image2, video)
       VALUES (@key, @label, @sort, 1, @eyebrow, @title, @title2, @body, @cta_label, @cta_href, @image, @image2, @video)`,
    );
    const blank = {
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

    insSection.run({
      ...blank,
      key: "hero",
      label: "首页头图 Hero",
      sort: 10,
      eyebrow: L("重新想象蝴蝶", "THE BUTTERFLY, REIMAGINED", "LE PAPILLON, RÉIMAGINÉ"),
      title: L(
        "美好，\n在发生之前。",
        "Beauty,\nBefore It Arrives.",
        "La beauté,\navant son éclosion.",
      ),
      body: L(
        "蝴蝶不是终点。它安静见证每一个你逐渐成为自己的时刻。",
        "A butterfly is not an ending. It is a quiet witness to every moment in which you become more fully yourself.",
        "Le papillon n’est pas une fin. Il témoigne en silence de chaque instant où vous devenez pleinement vous-même.",
      ),
      cta_label: L(
        "探索蝴蝶系列",
        "DISCOVER THE BUTTERFLY COLLECTION",
        "DÉCOUVRIR LA COLLECTION PAPILLON",
      ),
      cta_href: "#new",
      image: "/hero-muse-editorial.png",
      image2: "/chorchioee-butterfly-campaign-v2.png",
    });

    insSection.run({
      ...blank,
      key: "manifesto",
      label: "品牌宣言 Manifesto",
      sort: 20,
      eyebrow: S("01 / MANIFESTO"),
      title: L(
        "我们不替你定义美。\n我们只是安静见证它发生。",
        "We do not define beauty for you.\nWe quietly witness it becoming.",
        "Nous ne définissons pas la beauté pour vous.\nNous la regardons doucement devenir.",
      ),
      body: L(
        "根植于法国独立首饰设计精神，杜蔻以诚实、克制而自然的诗意，创作陪伴当代女性穿越时间的作品。",
        "Rooted in the spirit of independent French jewellery design, Chor Chioée creates pieces made to accompany contemporary women through time—honest, restrained, and touched by an effortless sense of poetry.",
        "Ancrée dans l’esprit de la joaillerie française indépendante, Chor Chioée crée des pièces sincères, retenues et empreintes d’une poésie naturelle.",
      ),
      image: "/manifesto-floral-shadow.webp",
    });

    insSection.run({
      ...blank,
      key: "icon",
      label: "Icon 区（蝴蝶）",
      sort: 30,
      eyebrow: S("02 / ICON"),
      title2: L("见证正在发生", "WITNESS THE BECOMING", "TÉMOIN DU DEVENIR"),
      title: L(
        "蝴蝶不是装饰。\n它是正在成为自己的你。",
        "The butterfly is not ornament.\nIt is you, becoming.",
        "Le papillon n’est pas un ornement.\nC’est vous, en devenir.",
      ),
      body: L(
        "从静止到振翅，每一道线条都捕捉改变前安静的一刻。",
        "From stillness to flight, each line captures the quiet moment before change.",
        "De l’immobilité à l’envol, chaque ligne saisit l’instant silencieux qui précède le changement.",
      ),
      cta_label: L("阅读系列故事", "READ THE COLLECTION STORY", "LIRE L’HISTOIRE DE LA COLLECTION"),
      cta_href: "#new",
      image: "/chorchioee-butterfly-campaign-v2.png",
      image2: "/chorchioee-butterfly-campaign-v2.png",
      video: "/icon-film.mp4",
    });

    insSection.run({
      ...blank,
      key: "new_arrivals",
      label: "新品栏标题",
      sort: 50,
      eyebrow: L("03 / 新近抵达", "03 / NEW PIECES", "03 / NOUVELLES PIÈCES"),
      title: L("新近抵达", "New Arrivals", "Nouveautés"),
      cta_label: L("查看全部 24 件作品", "VIEW ALL 24 PIECES", "VOIR LES 24 PIÈCES"),
      cta_href: "#all",
    });

    insSection.run({
      ...blank,
      key: "notes",
      label: "见证笔记 Witness Notes",
      sort: 60,
      eyebrow: L("04 / 见证笔记", "04 / WITNESS NOTES", "04 / NOTES DE TÉMOIGNAGE"),
      title: L(
        "她没有变成\n另一个人。",
        "She did not become\nsomeone else.",
        "Elle n’est pas devenue\nquelqu’un d’autre.",
      ),
      body: L(
        "她只是比昨天更靠近自己一点。我们记录那些无需庆祝、却值得被记住的时刻。",
        "She simply moved closer to herself than she was yesterday. We record the moments that ask for no celebration, yet deserve to be remembered.",
        "Elle s’est simplement rapprochée d’elle-même, un peu plus qu’hier. Nous consignons les instants qui ne demandent aucune célébration, et qui méritent pourtant d’être retenus.",
      ),
      cta_label: L("阅读见证笔记", "READ WITNESS NOTES", "LIRE LES NOTES"),
      cta_href: "#read",
      image: "/chorchioee-butterfly-campaign-v2.png",
    });

    insSection.run({
      ...blank,
      key: "subscribe",
      label: "页脚订阅区",
      sort: 80,
      title: L(
        "让下一个美好篇章\n自然抵达。",
        "Let the next beautiful chapter\narrive naturally.",
        "Laissez le prochain beau chapitre\nvenir naturellement.",
      ),
      title2: L("来自杜蔻的信", "LETTERS FROM CHOR CHIOÉE", "LETTRES DE CHOR CHIOÉE"),
      body: L("你的邮箱", "YOUR EMAIL", "VOTRE E-MAIL"),
      cta_label: L(
        "谢谢。下一个美好篇章开始时，我们会写信给你。",
        "Thank you. We will write when the next beautiful chapter begins.",
        "Merci. Nous vous écrirons lorsque le prochain beau chapitre commencera.",
      ),
    });

    /* ---------- 导航 / 分类导航 / 服务 ---------- */
    const insCard = conn.prepare(
      `INSERT INTO cards (group_key, sort, published, eyebrow, title, body, href, image)
       VALUES (@group_key, @sort, 1, @eyebrow, @title, @body, @href, '')`,
    );
    const card = (
      group_key: string,
      sort: number,
      eyebrow: string,
      title: string,
      body: string,
      href: string,
    ) => insCard.run({ group_key, sort, eyebrow, title, body, href });

    card("nav", 10, "{}", L("新品", "NEW", "NOUVEAUTÉS"), "{}", "#new");
    card("nav", 20, "{}", L("系列", "COLLECTIONS", "COLLECTIONS"), "{}", "#collections");
    card("nav", 30, "{}", L("品牌", "MAISON", "MAISON"), "{}", "#story");
    card("nav", 40, "{}", L("服务", "SERVICES", "SERVICES"), "{}", "#service");

    card("category", 10, "{}", L("全部作品", "All Pieces", "Toutes les pièces"), S("EXPLORE ALL"), "#new");
    card("category", 20, "{}", L("项链", "Necklaces", "Colliers"), S("NECKLACES"), "#new");
    card("category", 30, "{}", L("耳饰", "Earrings", "Boucles d’oreilles"), S("EARRINGS"), "#new");
    card("category", 40, "{}", L("戒指", "Rings", "Bagues"), S("RINGS"), "#new");
    card("category", 50, "{}", L("手链", "Bracelets", "Bracelets"), S("BRACELETS"), "#new");

    card(
      "service",
      10,
      S("SERVICE 01"),
      L("七天居家试戴", "At-Home Try-On", "Essayage à domicile"),
      L(
        "用七天时间，确认一件作品是否真正属于你。",
        "Take seven days to discover whether a piece truly belongs with you.",
        "Prenez sept jours pour découvrir si une pièce vous appartient vraiment.",
      ),
      "",
    );
    card(
      "service",
      20,
      S("SERVICE 02"),
      L("终身养护", "Lifetime Care", "Soin à vie"),
      L(
        "清洁、检查与维修，让每件作品继续见证时间。",
        "Cleaning, inspection, and repair allow every piece to continue witnessing time.",
        "Nettoyage, inspection et réparation permettent à chaque pièce de témoigner du temps.",
      ),
      "",
    );
    card(
      "service",
      30,
      S("SERVICE 03"),
      L("赠礼的艺术", "The Art of Gifting", "L’art d’offrir"),
      L(
        "克制而完整的呈现，保留打开礼物时的亲密感。",
        "Restrained presentation preserves the intimate moment of opening.",
        "Une présentation sobre préserve l’intimité du moment d’ouverture.",
      ),
      "",
    );

    /* ---------- 产品线（系列） ---------- */
    const insLine = conn.prepare(
      `INSERT INTO product_lines (slug, sort, published, number, eyebrow, title, body, cta_label, cta_href, image)
       VALUES (@slug, @sort, 1, @number, @eyebrow, @title, @body, @cta_label, @cta_href, @image)`,
    );
    const enterCta = L("进入系列", "ENTER THE COLLECTION", "ENTRER DANS LA COLLECTION");

    insLine.run({
      slug: "butterfly-at-rest",
      sort: 10,
      number: "01",
      eyebrow: S("COLLECTION 01"),
      title: L("心蝶\n静伏", "Butterfly\nAt Rest", "Papillon\nau repos"),
      body: L(
        "轻盈不是脆弱。它是改变来临前最安静的力量。",
        "Lightness is not fragility. It is the quietest strength in the moment before change.",
        "La légèreté n’est pas fragilité. C’est la force la plus silencieuse, juste avant le changement.",
      ),
      cta_label: enterCta,
      cta_href: "#new",
      image: "/butterfly-at-rest.webp",
    });

    insLine.run({
      slug: "between-the-stars",
      sort: 20,
      number: "02",
      eyebrow: S("COLLECTION 02"),
      title: L("星与星\n之间", "Between\nThe Stars", "Entre\nles étoiles"),
      body: L(
        "遥不可及的光，被温柔地留在日常的皮肤上。",
        "Light from beyond reach, held gently against the skin of everyday life.",
        "Une lumière hors d’atteinte, posée doucement sur la peau du quotidien.",
      ),
      cta_label: enterCta,
      cta_href: "#new",
      image: "/between-the-stars.webp",
    });

    insLine.run({
      slug: "open-ampersand",
      sort: 30,
      number: "03",
      eyebrow: S("COLLECTION 03"),
      title: L("敞开的\n连字符", "The Open\nAmpersand", "L’esperluette\nouverte"),
      body: L(
        "「&」不是结论。它是自我与世界之间，仍在展开的关系。",
        "“&” is not a conclusion. It is the relationship between self and world, still unfolding.",
        "« & » n’est pas une conclusion. C’est la relation entre soi et le monde, encore en train de se déployer.",
      ),
      cta_label: enterCta,
      cta_href: "#new",
      image: "/open-ampersand.webp",
    });

    /* ---------- 产品 ---------- */
    const insProduct = conn.prepare(
      `INSERT INTO products (slug, line_id, sort, published, name, category, badge, body, price, image, href)
       VALUES (@slug, @line_id, @sort, 1, @name, @category, @badge, '{}', @price, @image, '')`,
    );
    const silver = L("925 银 · 镀金", "925 SILVER / GOLD VERMEIL", "ARGENT 925 · VERMEIL");
    const bestseller = L("畅销", "BESTSELLER", "MEILLEURE VENTE");

    insProduct.run({
      slug: "double-arc",
      line_id: 1,
      sort: 10,
      name: S("Double Arc"),
      category: L("戒指", "Ring", "Bague"),
      badge: silver,
      price: "¥860",
      image: "/new-arrivals-double-arc.webp",
    });
    insProduct.run({
      slug: "eclosion",
      line_id: 1,
      sort: 20,
      name: S("Éclosion"),
      category: L("耳饰", "Earrings", "Boucles d’oreilles"),
      badge: bestseller,
      price: "¥980",
      image: "/new-arrivals-earrings.webp",
    });
    insProduct.run({
      slug: "lueur",
      line_id: 2,
      sort: 30,
      name: S("Lueur"),
      category: L("项链", "Necklace", "Collier"),
      badge: silver,
      price: "¥1,280",
      image: "/new-arrivals-necklace.webp",
    });
    insProduct.run({
      slug: "silence",
      line_id: 3,
      sort: 40,
      name: S("Silence"),
      category: L("手链", "Bracelet", "Bracelet"),
      badge: silver,
      price: "¥1,080",
      image: "/new-arrivals-bracelet.webp",
    });
  });

  tx();
}
