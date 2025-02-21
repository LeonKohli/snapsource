const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig([
    {
        label: 'integration',
        files: 'test/**/*.test.js',
        version: 'stable',
        workspaceFolder: './test/testWorkspace',
        mocha: {
            ui: 'tdd',
            timeout: 20000,
            color: true
        },
        // Disable other extensions to avoid interference
        launchArgs: ['--disable-extensions']
    },
    {
        label: 'formatting',
        files: 'test/**/*.test.js',
        version: 'stable',
        workspaceFolder: './test/testWorkspace',
        mocha: {
            ui: 'tdd',
            timeout: 20000,
            color: true
        },
        launchArgs: ['--disable-extensions']
    }
]); 