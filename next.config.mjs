import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build "standalone": gera um server.js mínimo com só as deps necessárias,
  // ideal para imagem Docker enxuta.
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/host/dashboard',
        permanent: true,
      },
      {
        source: '/host',
        destination: '/host/dashboard',
        permanent: true,
      },
    ]
  },
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

export default withMDX(nextConfig)
