import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The bill PDF renderer reads the Noto Sans TrueType files from disk at
  // runtime. Next's output tracer only bundles imported modules, so the fonts
  // must be included explicitly. On Vercel the function runs from /var/task,
  // where `public/` is not present (it is served by the CDN instead), which
  // caused: ENOENT public/fonts/NotoSans-Regular.ttf.
  outputFileTracingIncludes: {
    "/api/admin/bills/**": ["./public/fonts/**"],
    "/admin/bills/**": ["./public/fonts/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
