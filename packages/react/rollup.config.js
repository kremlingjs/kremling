import resolve from '@rollup/plugin-node-resolve';
const PACKAGE_ROOT_PATH = process.cwd();

module.exports = {
  external: ['react', 'react-dom'],
  input: `src/index.js`,
  output: [
    {
      file: 'dist/bundle.js',
      format: 'cjs',
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    resolve(),
  ],
};