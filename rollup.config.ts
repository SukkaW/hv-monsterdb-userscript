/// <reference types="node" />

import { swc, defineRollupSwcOption } from 'rollup-plugin-swc3';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';
import metablock from 'rollup-plugin-userscript-metablock';
import pkgJson from './package.json';
import MagicString from 'magic-string';
import { readFileSync } from 'fs';
import replace from '@rollup/plugin-replace';

import { Plugin, defineConfig } from 'rollup';

let cache;

const userScriptMetaBlockConfig = {
  file: './userscript.meta.json',
  override: {
    version: pkgJson.version,
    description: pkgJson.description,
    author: pkgJson.author
  }
};

function rollupPluginSettingLiteral(): Plugin {
  const settingsLiteral = readFileSync('src/settings.js', 'utf-8');
  return {
    name: 'rollup-plugin-setting-literal',
    renderChunk(code) {
      const magicString = new MagicString(code);
      magicString.prepend(`${settingsLiteral}\n`).trimEnd('\\n');
      const result = { code: magicString.toString() };
      return result;
    }
  };
}

export default defineConfig([{
  input: 'src/index.ts',
  output: [{
    format: 'iife',
    file: 'dist/hv-monsterdb.es2020.user.js',
    name: 'unsafeWindow.HVMonsterDB',
    sourcemap: false,
    esModule: false
  }],
  plugins: [
    nodeResolve(),
    replace({
      __buildMatrix__: JSON.stringify('es2020'),
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    swc(defineRollupSwcOption({
      jsc: {
        target: 'es2020'
      },
      tsconfig: './tsconfig.json'
    })),
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
    sourcemap: false,
    esModule: false
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    postcss({
      plugins: [
        cssnano()
      ]
    }),
    replace({
      __buildMatrix__: JSON.stringify('es2016'),
      preventAssignment: true
    }),
    rollupPluginSettingLiteral(),
    swc(defineRollupSwcOption({
      exclude: 'node_modules/core-js/**',
      tsconfig: './tsconfig.json',
      jsc: {
        target: 'es2016',
        externalHelpers: true,
        loose: true
      },
      env: {
        targets: 'chrome >= 79, firefox >= 60, edge >= 79, safari >= 11, not ie 11',
        coreJs: '3',
        mode: 'usage',
        shippedProposals: true
      }
    })),
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
}]);
