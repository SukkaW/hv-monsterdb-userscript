/* eslint-disable node/no-unsupported-features/es-syntax */
import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import metablock from 'rollup-plugin-userscript-metablock';
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
      '*hentaiverse.org/equip/*'
    ],
    'run-at': 'document-end'
  }
};

const babelConfig = {
  presets: [
    ['@babel/preset-env', {
      bugfixes: true,
      spec: false,
      useBuiltIns: 'usage',
      corejs: {
        version: '3.10'
      },
      shippedProposals: true,
      loose: true
    }]
  ],
  targets: {
    chrome: 50,
    firefox: 52,
    edge: 14,
    safari: 10
  },
  comments: false
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
    file: 'dist/hv-monsterdb.es5.user.js',
    name: 'unsafeWindow.HVMonsterDB',
    sourcemap: false
  },
  plugins: [
    typescript({
      target: 'ES5',
      downlevelIteration: true,
      tsconfig: './tsconfig.json'
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      ...babelConfig
    }),
    rollupPluginSettingLiteral(),
    metablock({
      ...userScriptMetaBlockConfig,
      override: {
        grant: [
          'unsafeWindow',
          'GM.getValue',
          'GM_getValue', // GMv3 Legacy API support
          'GM.setValue',
          'GM_setValue', // GMv3 Legacy API support
          'GM.deleteValue',
          'GM_deleteValue' // GMv3 Legacy API support
        ],
        require: [
          'https://cdn.jsdelivr.net/npm/gm4-polyfill@1.0.1/gm4-polyfill.es5.min.js'
        ]
      }
    })
  ],
  cache
}];
