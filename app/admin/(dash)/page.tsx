import Link from "next/link";
import { allLines, allMedia, allProducts, allSections, cardsOf } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function Overview() {
  const sections = allSections();
  const lines = allLines();
  const products = allProducts();
  const media = allMedia();
  const services = cardsOf("service");

  const stats = [
    { label: "首页模块", n: sections.filter((s) => s.published).length, total: sections.length, href: "/admin/sections" },
    { label: "产品线", n: lines.filter((l) => l.published).length, total: lines.length, href: "/admin/lines" },
    { label: "产品", n: products.filter((p) => p.published).length, total: products.length, href: "/admin/products" },
    { label: "媒体素材", n: media.length, total: media.length, href: "/admin/media" },
    { label: "服务条目", n: services.filter((s) => s.published).length, total: services.length, href: "/admin/texts" },
  ];

  return (
    <>
      <div className="pageHead">
        <h1>概览</h1>
        <p>改完任何内容，刷新官网即可看到效果，不需要重新部署。</p>
      </div>

      <div className="card">
        <div className="mediaGrid">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="mediaCard" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 28, fontFamily: "Georgia, serif" }}>
                {s.n}
                {s.total !== s.n ? <span style={{ fontSize: 14, opacity: 0.5 }}> / {s.total}</span> : null}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{s.label}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>怎么用</h2>
        <p className="sub">按你要改的东西选对应的栏目。</p>
        <div className="listRow">
          <div className="grow">
            <b>首页模块</b>
            <small>Hero 大图、品牌宣言、Icon 区、见证笔记、页脚订阅区的文案与配图</small>
          </div>
        </div>
        <div className="listRow">
          <div className="grow">
            <b>产品线</b>
            <small>三屏大图系列（心蝶静伏 / 星与星之间 / 敞开的连字符），可增删、排序、换图</small>
          </div>
        </div>
        <div className="listRow">
          <div className="grow">
            <b>产品</b>
            <small>新品栏里的单品：名称、品类、价格、标签、配图、所属产品线</small>
          </div>
        </div>
        <div className="listRow">
          <div className="grow">
            <b>媒体库</b>
            <small>上传新图片和视频，上传后可在各模块的「从媒体库选择」里直接用</small>
          </div>
        </div>
        <div className="listRow">
          <div className="grow">
            <b>导航与服务</b>
            <small>顶部导航、分类横条、底部三项服务说明</small>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>关于三语文案</h2>
        <p className="sub">
          每个文案框右上角有「中 / EN / FR」三个标签，分别填写。留空时前台会自动回退到英文，不会出现空白。
          系列面板和见证笔记的中文、法文是初稿，建议按品牌语言规范校对后再上线。
        </p>
      </div>
    </>
  );
}
