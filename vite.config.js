// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('vite');

module.exports = defineConfig({
    base: '/paste/',
    build: {
        target: [
            'es2020',
            'chrome80',
            'firefox80',
            'node14',
        ],
    },
});
