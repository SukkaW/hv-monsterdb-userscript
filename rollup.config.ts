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
import { adapter, analyzer } from 'vite-bundle-analyzer';

import type { Plugin } from 'rollup';
import { defineConfig } from 'rollup';

import { version as coreJsVersion } from 'core-js/package.json';

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

      return { code: magicString.toString(), map: magicString.generateMap() };
    }
  };
}

function buildConfig(target: 'es2020' | 'es2016') {
  return defineConfig({
    input: 'src/index.ts',
    output: {
      format: 'iife',
      file: `dist/hv-monsterdb.${target}.user.js`,
      name: 'unsafeWindow.HVMonsterDB',
      sourcemap: false,
      esModule: false
    },
    plugins: [
      target === 'es2016'
        ? commonjs({ esmExternals: true })
        : null,
      nodeResolve({
        exportConditions: ['import', 'module', 'default']
      }),
      replace({
        __buildMatrix__: JSON.stringify(target),
        'process.env.NODE_ENV': JSON.stringify('production'),
        'typeof process': JSON.stringify('undefined'),
        preventAssignment: true
      }),
      swc(defineRollupSwcOption({
        exclude: path.join(path.dirname(require.resolve('core-js/package.json')), '**'),
        jsc: {
          externalHelpers: true,
          target: target === 'es2020' ? target : undefined
        },
        sourceMaps: process.env.ANALYZE === 'true',
        env: target === 'es2020'
          ? undefined
          : {
            // skip: ['core-js/modules/**'],
            targets: 'chrome >= 79, firefox >= 60, edge >= 79, safari >= 11, not ie 11',
            coreJs: coreJsVersion,
            exclude: [
            ],
            mode: 'usage',
            shippedProposals: true,
            debug: false
          }
      })),
      postcss({
        plugins: [
          cssnano()
        ]
      }),
      rollupPluginSettingLiteral(),
      metablock({
        ...userScriptMetaBlockConfig,
        ...(
          target === 'es2020'
            ? {}
            : {
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
            }
        )
      }),
      process.env.ANALYZE === 'true'
        ? adapter(analyzer({
          openAnalyzer: true
        }))
        : null
    ],
    external: ['typed-query-selector']
  });
}

export default defineConfig([
  buildConfig('es2020'),
  buildConfig('es2016')
]);
