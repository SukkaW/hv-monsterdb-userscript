/* eslint-disable node/no-unsupported-features/es-syntax */
import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';
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
    ]
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
      shippedProposals: false,
      loose: true
    }]
  ],
  targets: 'chrome >= 79, firefox >= 60, edge >= 79, safari >= 11, not ie 11',
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
    nodeResolve(),
    typescript({
      target: 'ES2020',
      tsconfig: './tsconfig.json'
    }),
    postcss({
      plugins: [
        cssnano()
      ]
    }),
    rollupPluginSettingLiteral(),
    metablock(userScriptMetaBlockConfig)
  ],
  external: ['typed-query-selector'],
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
    nodeResolve(),
    typescript({
      target: 'ES2016',
      downlevelIteration: true,
      tsconfig: './tsconfig.json'
    }),
    postcss({
      plugins: [
        cssnano()
      ]
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
        ...userScriptMetaBlockConfig.override,
        grant: [
          'unsafeWindow',
          'GM.getValue',
          'GM_getValue', // GMv3 Legacy API support
          'GM.setValue',
          'GM_setValue', // GMv3 Legacy API support
          'GM.deleteValue',
          'GM_deleteValue' // GMv3 Legacy API support
        ]
      }
    })
  ],
  external: ['typed-query-selector'],
  cache
}];
