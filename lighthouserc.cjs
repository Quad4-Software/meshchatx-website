module.exports = {
    ci: {
        collect: {
            numberOfRuns: 3,
            startServerCommand: 'bash scripts/serve-ci.sh 4173',
            url: [
                'http://127.0.0.1:4173/',
                'http://127.0.0.1:4173/download',
                'http://127.0.0.1:4173/dependency',
                'http://127.0.0.1:4173/interfaces',
                'http://127.0.0.1:4173/docs',
                'http://127.0.0.1:4173/git',
            ],
            settings: {
                preset: 'desktop',
                chromeFlags: '--no-sandbox --disable-dev-shm-usage',
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.95 }],
                'categories:best-practices': ['error', { minScore: 0.9 }],
                'categories:seo': ['error', { minScore: 0.95 }],
                'is-on-https': 'off',
                'uses-http2': 'off',
                'uses-text-compression': 'off',
                'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
                'total-byte-weight': ['warn', { maxNumericValue: 1200000 }],
                'csp-xss': ['warn', { minScore: 1 }],
            },
        },
        upload: {
            target: 'filesystem',
            outputDir: '.lighthouseci',
        },
    },
};
