import svgr from 'vite-plugin-svgr';

export default {
  plugins: [svgr()],
  build: {
    sourcemap: true,
  },
};
