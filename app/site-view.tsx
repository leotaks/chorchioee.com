"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import type { PageData } from "@/lib/content";
import { LANGS, type Lang } from "@/lib/types";

type Props = {
  data: Record<Lang, PageData>;
  defaultLang: Lang;
};

/** 把图片地址包成 CSS 变量值；为空时返回 undefined，走样式表里的默认图 */
function imgVar(name: string, url: string): CSSProperties {
  if (!url) return {};
  return { [name]: `url('${encodeURI(url)}')` } as CSSProperties;
}

/** 多行文案，用 <br/> 连接——与原版 DOM 结构保持一致 */
function Multiline({ items }: { items: string[] }) {
  return (
    <>
      {items.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

export default function SiteView({ data, defaultLang }: Props) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const d = data[lang];

  const [menu, setMenu] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);

  /* 记住上次选择的语言 */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chor-lang");
      if (saved && (LANGS as readonly string[]).includes(saved)) {
        setLang(saved as Lang);
        document.documentElement.lang = saved === "zh" ? "zh-CN" : saved;
      }
    } catch {
      /* 隐私模式下读不到，忽略 */
    }
  }, []);

  /* 滚动、视差、入场动画 —— 与原版完全一致 */
  useEffect(() => {
    let raf = 0;
    let lastScrolled = false;
    let lastShowTop = false;
    let viewportHeight = innerHeight;
    let compact = matchMedia("(max-width: 760px)").matches;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parallax = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const iconScene = document.querySelector<HTMLElement>("[data-icon-scene]");

    const move = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const nextScrolled = y > 40;
        const nextShowTop = y > viewportHeight * 0.65;
        if (nextScrolled !== lastScrolled) {
          lastScrolled = nextScrolled;
          setScrolled(nextScrolled);
        }
        if (nextShowTop !== lastShowTop) {
          lastShowTop = nextShowTop;
          setShowTop(nextShowTop);
        }
        if (!reduced) {
          for (const el of parallax) {
            if (compact && (el.classList.contains("pic") || el.classList.contains("photo"))) continue;
            const r = el.getBoundingClientRect();
            if (r.bottom < viewportHeight * -0.2 || r.top > viewportHeight * 1.2) continue;
            const n = (viewportHeight / 2 - (r.top + r.height / 2)) / viewportHeight;
            el.style.setProperty("--p", `${n.toFixed(3)}`);
          }
          if (iconScene) {
            const r = iconScene.getBoundingClientRect();
            if (r.bottom > 0 && r.top < viewportHeight) {
              const range = Math.max(1, r.height - viewportHeight);
              const progress = Math.max(0, Math.min(1, -r.top / range));
              iconScene.style.setProperty("--ip", `${progress.toFixed(3)}`);
            }
          }
        }
        raf = 0;
      });
    };

    const resize = () => {
      viewportHeight = innerHeight;
      compact = matchMedia("(max-width: 760px)").matches;
      move();
    };

    const observer = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("inview");
            observer.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    addEventListener("scroll", move, { passive: true });
    addEventListener("resize", resize, { passive: true });
    move();
    return () => {
      removeEventListener("scroll", move);
      removeEventListener("resize", resize);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [d.lines.length, d.products.length]);

  /* 移动端菜单关闭 */
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(".menu")) return;
      setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    addEventListener("click", close);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("click", close);
      removeEventListener("keydown", onKey);
    };
  }, [menu]);

  /* 刷新后回到顶部 */
  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    const resetPositions = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const rail = document.querySelector<HTMLElement>(".service");
      if (rail) rail.scrollTo({ left: 0, behavior: "auto" });
    };
    const raf = requestAnimationFrame(resetPositions);
    const timer = window.setTimeout(resetPositions, 160);
    addEventListener("pageshow", resetPositions);
    return () => {
      history.scrollRestoration = previousRestoration;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      removeEventListener("pageshow", resetPositions);
    };
  }, []);

  return (
    <main>
      {d.announceEnabled && d.announce ? <div className="announce">{d.announce}</div> : null}

      <header className={scrolled ? "solid" : ""}>
        <button
          className="menu"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          {menu ? "×" : "☰"}
        </button>
        <nav className={menu ? "open" : ""}>
          {d.nav.map((item, i) => (
            <a key={i} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="logo" href="#top">
          {d.brand.name}
          <small>{d.brand.sub}</small>
        </a>
        <div className="headerTools">
          <div className="langSwitch" role="group" aria-label="Language">
            {(["en", "fr", "zh"] as Lang[]).map((l) => (
              <button
                key={l}
                className={lang === l ? "active" : ""}
                onClick={() => {
                  setLang(l);
                  try {
                    localStorage.setItem("chor-lang", l);
                  } catch {
                    /* ignore */
                  }
                  document.documentElement.lang = l === "zh" ? "zh-CN" : l;
                }}
              >
                {l === "zh" ? "中" : l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {d.hero.show && (
        <section className="hero" id="top">
          <div className="heroField" data-parallax style={imgVar("--img-hero", d.hero.bg)}>
            {d.hero.image ? (
              <img
                className="heroVideo heroPortrait"
                src={d.hero.image}
                alt={d.hero.eyebrow || d.brand.name}
              />
            ) : null}
            <div className="orb">
              <i />
            </div>
          </div>
          <div className="heroCopy reveal">
            <small>{d.hero.eyebrow}</small>
            <h1>
              <Multiline items={d.hero.titleLines} />
            </h1>
            <p>{d.hero.body}</p>
            {d.hero.ctaLabel ? <a href={d.hero.ctaHref}>{d.hero.ctaLabel}　→</a> : null}
          </div>
          {d.edition ? <b>{d.edition}</b> : null}
          <span className="scrollCue">
            {d.scrollCue}
            <br />↓
          </span>
        </section>
      )}

      {d.categories.length > 0 && (
        <section className="categoryRail">
          {d.categories.map((c, i) => (
            <a key={i} href={c.href}>
              {c.label} <span>{c.sub}</span>
            </a>
          ))}
        </section>
      )}

      {d.manifesto.show && (
        <section
          className="manifesto reveal"
          id="story"
          style={imgVar("--img-manifesto", d.manifesto.bg)}
        >
          <small>{d.manifesto.eyebrow}</small>
          <h2>
            “<Multiline items={d.manifesto.titleLines} />”
          </h2>
          <p>{d.manifesto.body}</p>
        </section>
      )}

      {d.icon.show && (
        <section className="iconScene" id="icon" data-icon-scene>
          <div className="iconSticky">
            <div className="iconArt" style={imgVar("--img-icon", d.icon.bg)}>
              {d.icon.video ? (
                <video
                  className="iconVideo"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={d.icon.poster || undefined}
                  aria-hidden="true"
                >
                  <source src={d.icon.video} type="video/mp4" />
                </video>
              ) : null}
              <div className="ring ringOuter" />
              <div className="ring ringMiddle" />
              <div className="ring ringInner" />
              <div className="iconButterfly">
                <i />
                <i />
              </div>
              <small>{d.icon.label}</small>
            </div>
            <div className="iconCopy">
              <small>{d.icon.eyebrow}</small>
              <h2>
                {d.icon.titleLines.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </h2>
              <p>{d.icon.body}</p>
              {d.icon.ctaLabel ? (
                <a href={d.icon.ctaHref}>
                  <span>{d.icon.ctaLabel}</span>
                  <b>→</b>
                </a>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {d.lines.length > 0 && (
        <section className="collectionStack" id="collections">
          {d.lines.map((line, i) => (
            <article
              key={line.id}
              className={`collectionPanel cp${(i % 3) + 1}`}
              data-parallax
              style={imgVar("--img-cp", line.image)}
            >
              <div className="panelBg" />
              <div className="panelCopy reveal">
                <small>{line.eyebrow}</small>
                <h2>
                  <Multiline items={line.titleLines} />
                </h2>
                <p>{line.body}</p>
                {line.ctaLabel ? <a href={line.ctaHref}>{line.ctaLabel}　→</a> : null}
              </div>
              <b>{line.number}</b>
            </article>
          ))}
        </section>
      )}

      {d.newArrivals.show && (
        <section className="shop" id="new">
          <div className="shopHead reveal">
            <div>
              <small>{d.newArrivals.eyebrow}</small>
              <h2>{d.newArrivals.title}</h2>
            </div>
            {d.newArrivals.ctaLabel ? (
              <a href={d.newArrivals.ctaHref}>{d.newArrivals.ctaLabel} →</a>
            ) : null}
          </div>
          <div className="grid">
            {d.products.map((p, i) => (
              <article className="reveal" key={p.id}>
                <div
                  className={`pic p${i % 4}`}
                  data-parallax
                  style={imgVar("--img-product", p.image)}
                >
                  <span />
                  <small>{p.badge}</small>
                </div>
                <div className="meta">
                  <div>
                    <h3>{p.href ? <a href={p.href}>{p.name}</a> : p.name}</h3>
                    <p>{p.category}</p>
                  </div>
                  <div>
                    <p>{p.price}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {d.notes.show && (
        <section className="notes">
          <div className="photo" data-parallax style={imgVar("--img-notes", d.notes.image)}>
            <i />
          </div>
          <div className="reveal">
            <small>{d.notes.eyebrow}</small>
            <h2>
              <Multiline items={d.notes.titleLines} />
            </h2>
            <p>{d.notes.body}</p>
            {d.notes.ctaLabel ? <a href={d.notes.ctaHref}>{d.notes.ctaLabel}　→</a> : null}
          </div>
        </section>
      )}

      {d.services.length > 0 && (
        <section className="service" id="service">
          {d.services.map((s) => (
            <div className="reveal" key={s.id}>
              <small>{s.eyebrow}</small>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </section>
      )}

      <footer>
        {d.subscribe.show && (
          <div className="subscribe">
            <h2>
              <Multiline items={d.subscribe.titleLines} />
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setThanks(true);
              }}
            >
              <label>{d.subscribe.label}</label>
              <div>
                <input
                  aria-label="Email address"
                  type="email"
                  placeholder={d.subscribe.placeholder}
                  required
                />
                <button aria-label="Subscribe">→</button>
              </div>
              {thanks && <p>{d.subscribe.thanks}</p>}
            </form>
          </div>
        )}
        <div className="foot">
          <b>{d.brand.name}</b>
          <span>{d.footer.links}</span>
          <span>
            {d.footer.copyright}
            {d.footer.icp ? (
              <>
                {" · "}
                <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
                  {d.footer.icp}
                </a>
              </>
            ) : null}
          </span>
        </div>
      </footer>

      <button
        className={showTop ? "backToTop visible" : "backToTop"}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span>↑</span>
        <b>{d.backToTop}</b>
      </button>
    </main>
  );
}
