const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');
const fs = require('fs');

function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 30000 // 30 seconds timeout for all tests
    });

    const testsRoot = path.resolve(__dirname, '..');
    
    // Ensure testWorkspace directory exists
    const testWorkspacePath = path.join(testsRoot, 'testWorkspace');
    if (!fs.existsSync(testWorkspacePath)) {
        fs.mkdirSync(testWorkspacePath, { recursive: true });
    }
    
    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}

module.exports = {
    run
};