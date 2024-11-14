'use strict';

module.exports = require('eslint-config-sukka').sukka({}, {
  files: ['src/settings.js'],
  rules: {
    'no-unused-vars': 'off'
  }
});
