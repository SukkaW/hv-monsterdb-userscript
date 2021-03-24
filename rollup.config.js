/* eslint-disable node/no-unsupported-features/es-syntax */
import typescript from '@rollup/plugin-typescript';
import metablock from 'rollup-plugin-userscript-metablock';
import { terser } from 'rollup-plugin-terser';
import pkgJson from './package.json';
import MagicString from 'magic-string';
import { readFileSync } from 'fs';

let cache;

const userScriptMetaBlockConfig = {
  file: './userscript.meta.json',
  override: {
    version: pkgJson.version,
    description: pkgJson.description,
    author: pkgJson.author,
    match: [
      '*://*.hentaiverse.org/*'
    ],
    exclude: [
      'http*://hentaiverse.org/pages/showequip.php?*',
      'http://alt.hentaiverse.org',
      '*hentaiverse.org/equip/*',
      '*hentaiverse.org/equip/*'
    ]
  }
};

function rollupPluginSettingLiteral() {
  const settingsLiteral = readFileSync('src/settings.js', 'utf-8');
  return {
    renderChunk(code) {
      const magicString = new MagicString(code);
      magicString.prepend(`${settingsLiteral}\n`).trimEnd('\\n');
      const result = { code: magicString.toString() };
      return result;
    }
  };
}

export default [{
  input: 'src/index.ts',
  output: [{
    format: 'iife',
    file: 'dist/hv-monsterdb.es2020.user.js',
    name: 'unsafeWindow.HVMonsterDB',
    sourcemap: false
  }, {
    format: 'iife',
    file: 'dist/hv-monsterdb.es2020.user.min.js',
    name: 'unsafeWindow.HVMonsterDB',
    sourcemap: false,
    plugins: [terser({ format: { comments: false } })]
  }],
  plugins: [
    typescript({
      target: 'ES2020',
      tsconfig: './tsconfig.json'
    }),
    rollupPluginSettingLiteral(),
    metablock(userScriptMetaBlockConfig)
  ],
  cache
}, {
  input: 'src/index.ts',
  output: {
    format: 'iife',
    file: 'dist/hv-monsterdb.es5.user.min.js',
    name: 'unsafeWindow.HVMonsterDB',
    sourcemap: false,
    plugins: [terser({ format: { comments: false } })]
  },
  plugins: [
    typescript({
      target: 'ES5',
      downlevelIteration: true,
      tsconfig: './tsconfig.json'
    }),
    rollupPluginSettingLiteral(),
    metablock(userScriptMetaBlockConfig)
  ],
  cache
}];
