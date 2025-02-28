const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');

// Create the mocha test
const mocha = new Mocha({
    ui: 'tdd',
    color: true
});

// Use glob to get all test files
const testsRoot = path.resolve(__dirname);
const pattern = 'extension.test.js';

// Use glob to find all test files that match our pattern
glob(pattern, { cwd: testsRoot }, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    try {
        // Run the mocha test
        mocha.run(failures => {
            if (failures > 0) {
                console.error(`${failures} tests failed.`);
            }
        });
    } catch (err) {
        console.error(err);
        console.error('Failed to run tests');
    }
});