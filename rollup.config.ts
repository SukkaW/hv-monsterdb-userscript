/// <reference types="node" />

import { swc, defineRollupSwcOption } from 'rollup-plugin-swc3';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';
import metablock from 'rollup-plugin-userscript-metablock';
import pkgJson from './package.json';
import MagicString from 'magic-string';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import replace from '@rollup/plugin-replace';

import type { Plugin } from 'rollup';
import { defineConfig } from 'rollup';

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
      magicString.prepend(`${settingsLiteral}\n`).trimEnd(String.raw`\n`);

      return { code: magicString.toString() };
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
        target: 'es2020',
        externalHelpers: true
      }
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
    file: 'dist/hv-monsterdb.es2016.user.js',
    name: 'unsafeWindow.HVMonsterDB',
    sourcemap: false,
    esModule: false
  },
  plugins: [
    commonjs({
      esmExternals: true
    }),
    nodeResolve({
      exportConditions: ['import', 'module', 'default']
    }),
    postcss({
      plugins: [
        cssnano()
      ]
    }),
    replace({
      __buildMatrix__: JSON.stringify('es2016'),
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    rollupPluginSettingLiteral(),
    swc(defineRollupSwcOption({
      exclude: path.join(path.dirname(require.resolve('core-js/package.json')), '**'),
      tsconfig: './tsconfig.json',
      jsc: {
        target: undefined,
        externalHelpers: true
        // loose: true
      },
      env: {
        targets: 'chrome >= 79, firefox >= 60, edge >= 79, safari >= 11, not ie 11',
        coreJs: '3.26',
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
