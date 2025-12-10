/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    // Externalize packages with native binaries that can't be bundled by webpack
    serverComponentsExternalPackages: ['sharp', '@tapandstamp/imaging']
  },
  // Ensure webpack doesn't try to bundle sharp
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('sharp');
    }
    return config;
  }
};

export default config;
