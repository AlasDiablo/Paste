// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig }  from 'vite';

export default defineConfig({
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
