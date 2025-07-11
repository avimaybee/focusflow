
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js built-in modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        assert: false,
        async_hooks: false,
        buffer: false,
        child_process: false,
        cluster: false,
        console: false,
        constants: false,
        crypto: false,
        dgram: false,
        dns: false,
        domain: false,
        events: false,
        fs: false,
        http: false,
        https: false,
        http2: false,
        inspector: false,
        module: false,
        net: false,
        os: false,
        path: false,
        perf_hooks: false,
        process: false,
        punycode: false,
        querystring: false,
        readline: false,
        repl: false,
        stream: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tls: false,
        tty: false,
        url: false,
        util: false,
        v8: false,
        vm: false,
        worker_threads: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;
