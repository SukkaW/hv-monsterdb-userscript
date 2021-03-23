/* eslint-disable node/no-unsupported-features/es-syntax */
import typescript from '@rollup/plugin-typescript';
import metablock from 'rollup-plugin-userscript-metablock';
import { terser } from 'rollup-plugin-terser';
import pkgJson from './package.json';
import MagicString from 'magic-string';
import { readFileSync } from 'fs';

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
  output: {
    format: 'iife',
    file: 'dist/userscript/hv-monsterdb.user.js',
    name: 'unsafeWindow.HVUserLandApi',
    globals: {
      document: 'document',
      window: 'window'
    },
    plugins: [
      // terser(),
      /** Custom plugin for generating settings */
      rollupPluginSettingLiteral(),
      metablock(userScriptMetaBlockConfig)
    ],
    sourcemap: false
  },
  plugins: [
    typescript({
      module: 'ES2015',
      tsconfig: './tsconfig.json'
    })
  ]
}];
