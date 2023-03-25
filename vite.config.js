// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        target: [
            'es2020',
            'chrome80',
            'firefox80',
            'node16',
        ],
    },
});
