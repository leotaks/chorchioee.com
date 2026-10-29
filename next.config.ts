import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 是原生模块，必须留给 Node 直接 require，不能被打包
  serverExternalPackages: ["better-sqlite3"],

  // 站点用的是普通 <img>，不走 Next 图片优化，服务器上也就不需要 sharp
  images: { unoptimized: true },

  // 后台上传的图片和视频可能较大
  experimental: {
    serverActions: { bodySizeLimit: "64mb" },
  },

  // 部署到自己的服务器时，standalone 产物体积最小（见 部署说明.md）
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default nextConfig;
