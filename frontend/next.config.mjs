// // next.config.mjs
// const isProd = process.env.NODE_ENV === 'production';
// const repoName = 'agrifiles-frontend'; // your repo name

// /** @type {import('next').NextConfig} */
// const nextConfig = {
// //   //output: 'export', // important: generate static HTML
// //   basePath: isProd ? `/${repoName}` : '',
// //   assetPrefix: isProd ? `/${repoName}/` : '',
// //   images: {
// //     unoptimized: true, // GitHub Pages doesn't support next/image optimization
// //   },
// //   trailingSlash: true, // helps avoid some 404s on Pages
// //     eslint: {
// //     // ❗ Vercel will still build even if there are ESLint errors
// //     ignoreDuringBuilds: true,
// //   }
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turn off ESLint during builds (so Vercel doesn't fail on lint errors)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // If you had `output: 'export'` before, REMOVE it for Vercel
  // DO NOT add: output: 'export'
};

export default nextConfig;
