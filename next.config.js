/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Normalize externals to object format for consistent handling
    if (Array.isArray(config.externals)) {
      // Convert array to object format
      config.externals = config.externals.reduce((acc, ext) => {
        if (typeof ext === 'string') {
          acc[ext] = ext;
        } else if (typeof ext === 'object' && ext !== null) {
          Object.assign(acc, ext);
        }
        return acc;
      }, {});
    } else if (!config.externals || typeof config.externals !== 'object') {
      config.externals = {};
    }

    // Mark server-only packages as external for client bundle
    if (!isServer) {
      config.externals['ollama'] = 'ollama';
    }

    // Mark optional dependencies as external (they may not be installed)
    if (isServer) {
      config.externals['redis'] = 'commonjs redis';
      config.externals['mariadb'] = 'commonjs mariadb';
    }

    return config;
  },
};

module.exports = nextConfig;
