/** @type {import('next').NextConfig} */
const buildCpus = Number(process.env.NEXT_BUILD_CPUS);

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
    // Batasi jumlah worker build (dipakai di VPS dengan limit proses OpenVZ):
    // NEXT_BUILD_CPUS=1 npm run build
    ...(Number.isFinite(buildCpus) && buildCpus > 0 ? { cpus: buildCpus } : {}),
  },
  async headers() {
    return [
      {
        // Konten publik dari CMS — aman di-cache di edge (Cloudflare) & browser.
        source: "/api/content",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    // Hanya webp: menutup jalur AVIF yang terdampak advisory image optimizer.
    formats: ["image/webp"],
    // Cache hasil optimizer lama (30 hari) agar beban sharp turun saat trafik tinggi.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/api/portraits/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-8156d70781324453bda28e90108800f1.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
