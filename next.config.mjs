/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: the whole game ships as plain HTML/CSS/JS with no
  // application server, which keeps hosting free, cheap to scale and usable
  // on low-bandwidth connections (core lessons also work offline once cached).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
