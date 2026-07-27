import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        minify: true,
        reportCompressedSize: false,
        rollupOptions: {
            // The WASAPI loopback addon (native/wasapi-loopback, required as
            // the "wasapi-loopback" node_modules package) must stay a real,
            // external require() at runtime rather than get inlined by
            // Rollup, since it loads a compiled .node binary from disk.
            external: [/wasapi-loopback/],
        },
    },
});
