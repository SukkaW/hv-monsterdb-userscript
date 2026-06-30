'use strict';

module.exports = require('eslint-config-sukka').sukka({
  ignores: {
    customGlobs: ['src/meta.js']
  }
}, {
  files: ['src/settings.js'],
  rules: {
    'no-unused-vars': 'off'
  }
});
