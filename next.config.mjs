/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist is imported client-side only; keep it out of the server bundle.
  serverExternalPackages: ['pdfjs-dist', '@azure/ai-projects', '@azure/identity'],
};

export default nextConfig;
