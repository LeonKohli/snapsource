const assert = require('assert');
const vscode = require('vscode');
const extension = require('../extension');
const path = require('path');

suite('SnapSource Extension Test Suite', () => {
    suiteSetup(async () => {
        // This is run once before all tests
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suiteTeardown(() => {
        // This is run once after all tests
        vscode.window.showInformationMessage('All tests complete!');
    });

    setup(() => {
        // This is run before each test
    });

    teardown(async () => {
        // This is run after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Extension Basics', () => {
        test('Extension should be present', () => {
            assert.ok(vscode.extensions.getExtension('LeonKohli.snapsource'));
        });

        test('Should activate extension', async () => {
            const ext = vscode.extensions.getExtension('LeonKohli.snapsource');
            await ext.activate();
            assert.strictEqual(ext.isActive, true);
        });

        test('Should register command', async () => {
            const commands = await vscode.commands.getCommands();
            assert.ok(commands.includes('snapsource.copyToClipboard'));
        });
    });

    suite('Content Formatting', () => {
        test('Should format content correctly with all formats', async () => {
            // Create test data
            const projectTree = '├── src\n│   └── index.js\n└── package.json\n';
            const content = [
                {
                    path: 'src/index.js',
                    content: 'console.log("Hello World")'
                },
                {
                    path: 'package.json',
                    content: '{"name": "test"}'
                }
            ];

            // Test plaintext format
            const plaintextResult = extension.formatOutput('plaintext', projectTree, content);
            assert.strictEqual(typeof plaintextResult, 'string', 'Plaintext output should be a string');
            assert.ok(plaintextResult.includes('Project Structure:'), 'Should include project structure header');
            assert.ok(plaintextResult.includes('src/index.js'), 'Should include file path');
            assert.ok(plaintextResult.includes('console.log("Hello World")'), 'Should include file content');
            assert.ok(plaintextResult.includes('package.json'), 'Should include file path');
            assert.ok(plaintextResult.includes('{"name": "test"}'), 'Should include file content');

            // Test markdown format
            const markdownResult = extension.formatOutput('markdown', projectTree, content);
            assert.strictEqual(typeof markdownResult, 'string', 'Markdown output should be a string');
            assert.ok(markdownResult.includes('# Project Structure'), 'Should include project structure header');
            assert.ok(markdownResult.includes('```\n' + projectTree + '```'), 'Should include project tree in code block');
            assert.ok(markdownResult.includes('```js\nconsole.log("Hello World")'), 'Should include JS code block');
            assert.ok(markdownResult.includes('```json\n{"name": "test"}'), 'Should include JSON code block');

            // Test XML format
            const xmlResult = extension.formatOutput('xml', projectTree, content);
            assert.strictEqual(typeof xmlResult, 'string', 'XML output should be a string');
            assert.ok(xmlResult.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should include XML declaration');
            assert.ok(xmlResult.includes('<project_structure>'), 'Should include project structure tag');
            assert.ok(xmlResult.includes('<file path="src/index.js">'), 'Should include file tag with path');
            assert.ok(xmlResult.includes('<![CDATA[console.log("Hello World")]]>'), 'Should include content in CDATA');
            assert.ok(xmlResult.includes('<file path="package.json">'), 'Should include file tag with path');
            assert.ok(xmlResult.includes('<![CDATA[{"name": "test"}]]>'), 'Should include content in CDATA');
        });

        test('Should handle empty project tree', async () => {
            const content = [{
                path: 'test.txt',
                content: 'test content'
            }];

            // Test with empty project tree
            const plaintextResult = extension.formatOutput('plaintext', '', content);
            assert.ok(!plaintextResult.includes('Project Structure:'), 'Should not include project structure section');
            assert.ok(plaintextResult.includes('File Contents:'), 'Should include file contents header');
            assert.ok(plaintextResult.includes('test content'), 'Should include file content');

            const markdownResult = extension.formatOutput('markdown', '', content);
            assert.ok(!markdownResult.includes('# Project Structure'), 'Should not include project structure section');
            assert.ok(markdownResult.includes('# File Contents'), 'Should include file contents header');
            assert.ok(markdownResult.includes('test content'), 'Should include file content');

            const xmlResult = extension.formatOutput('xml', '', content);
            assert.ok(!xmlResult.includes('<project_structure>'), 'Should not include project structure tag');
            assert.ok(xmlResult.includes('<file_contents>'), 'Should include file contents tag');
            assert.ok(xmlResult.includes('<![CDATA[test content]]>'), 'Should include content in CDATA');
        });

        test('Should handle special characters in XML', async () => {
            const content = [{
                path: 'test & demo.xml',
                content: '<test>Hello & World</test>'
            }];

            const xmlResult = extension.formatOutput('xml', '', content);
            
            // Check path attribute is properly escaped
            assert.ok(xmlResult.includes('path="test &amp; demo.xml"'), 'Should escape special characters in path attribute');
            
            // Check content is wrapped in CDATA
            assert.ok(xmlResult.includes('<![CDATA[<test>Hello & World</test>]]>'), 'Should wrap content in CDATA');
        });

        test('Should handle different file extensions correctly in markdown', async () => {
            const content = [
                {
                    path: 'script.py',
                    content: 'print("Hello")'
                },
                {
                    path: 'style.css',
                    content: 'body { color: red; }'
                },
                {
                    path: 'data.yml',
                    content: 'key: value'
                },
                {
                    path: 'noextension',
                    content: 'plain text'
                }
            ];

            const markdownResult = extension.formatOutput('markdown', '', content);
            
            // Check language-specific code blocks
            assert.ok(markdownResult.includes('```py\nprint("Hello")'), 'Should use py language for Python files');
            assert.ok(markdownResult.includes('```css\nbody { color: red; }'), 'Should use css language for CSS files');
            assert.ok(markdownResult.includes('```yml\nkey: value'), 'Should use yml language for YAML files');
            assert.ok(markdownResult.includes('```\nplain text'), 'Should use no language for files without extension');
        });

        test('Should handle empty content array', async () => {
            const formats = ['plaintext', 'markdown', 'xml'];
            for (const format of formats) {
                const result = extension.formatOutput(format, '', []);
                assert.ok(result.length > 0, `${format} format should handle empty content`);
                assert.ok(!result.includes('undefined'), `${format} format should not contain undefined`);
                assert.ok(typeof result === 'string', `${format} format should return a string`);
            }
        });
    });

    suite('Content Processing', () => {
        test('Should remove comments correctly', () => {
            const testCases = [
                {
                    input: '// Single line comment\nconst x = 1;\n/* Multi\nline\ncomment */\nconst y = 2;',
                    expected: '\nconst x = 1;\n\nconst y = 2;'
                },
                {
                    input: 'const x = 1; // Inline comment\nconst y = 2; /* inline multi */',
                    expected: 'const x = 1; \nconst y = 2; '
                },
                {
                    input: '/* Comment with // nested single line */\ncode();',
                    expected: '\ncode();'
                }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = extension.removeCodeComments(input);
                assert.strictEqual(result, expected, 'Should remove comments correctly');
            });
        });

        test('Should compress code correctly', () => {
            const testCases = [
                {
                    input: '  const x = 1;  \n\n  const y = 2;  \n',
                    expected: 'const x = 1;\nconst y = 2;'
                },
                {
                    input: '\n\n\nconst x = 1;\n\n\n',
                    expected: 'const x = 1;'
                },
                {
                    input: '    if (true) {\n        console.log("test");\n    }    ',
                    expected: 'if (true) {\nconsole.log("test");\n}'
                }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = extension.compressCodeContent(input);
                assert.strictEqual(result, expected, 'Should compress code correctly');
            });
        });

        test('Should handle combined comment removal and compression', () => {
            const input = `
                // Header comment
                function test() {
                    /* Multi-line
                       comment */
                    console.log("test");  // Inline comment
                }
            `;
            
            const expectedAfterCommentRemoval = `
                
                function test() {
                    
                    console.log("test");  
                }
            `;
            
            const expectedFinal = 'function test() {\nconsole.log("test");\n}';
            
            const withoutComments = extension.removeCodeComments(input);
            assert.strictEqual(withoutComments, expectedAfterCommentRemoval, 'Should remove all comments');
            
            const compressed = extension.compressCodeContent(withoutComments);
            assert.strictEqual(compressed, expectedFinal, 'Should compress code after comment removal');
            
            // Test processContent function directly
            const processed = extension.processContent(input, true, true);
            assert.strictEqual(processed, expectedFinal, 'Should process content with both options');
        });
    });

    suite('Command Functionality', () => {
        test('Should respect configuration settings', async function() {
            // Increase timeout for this test
            this.timeout(30000);
            
            // Get the configuration
            const config = vscode.workspace.getConfiguration('snapsource');
            
            try {
                // Reset settings first to ensure clean state
                await config.update('outputFormat', undefined, vscode.ConfigurationTarget.Global);
                await config.update('maxDepth', undefined, vscode.ConfigurationTarget.Global);
                
                // Wait for settings to be reset
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Update settings
                await config.update('outputFormat', 'markdown', vscode.ConfigurationTarget.Global);
                await config.update('maxDepth', 3, vscode.ConfigurationTarget.Global);
                
                // Wait for settings to be applied
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Get a fresh configuration instance
                const updatedConfig = vscode.workspace.getConfiguration('snapsource');
                
                // Verify settings
                const format = updatedConfig.get('outputFormat');
                const depth = updatedConfig.get('maxDepth');
                
                assert.strictEqual(format, 'markdown', 'Should update output format setting');
                assert.strictEqual(depth, 3, 'Should update max depth setting');

            } finally {
                // Reset settings in cleanup
                await config.update('outputFormat', undefined, vscode.ConfigurationTarget.Global);
                await config.update('maxDepth', undefined, vscode.ConfigurationTarget.Global);
            }
        });

        test('Should handle binary files correctly', async () => {
            const testFilePath = path.join(__dirname, 'testWorkspace', 'test.bin');
            const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG magic number
            
            // Create a binary file
            await vscode.workspace.fs.writeFile(vscode.Uri.file(testFilePath), buffer);

            try {
                const uri = vscode.Uri.file(testFilePath);
                await vscode.commands.executeCommand('snapsource.copyToClipboard', uri);
                
                const clipboardContent = await vscode.env.clipboard.readText();
                assert.ok(clipboardContent.includes('[Binary file content not included]'), 
                    'Should indicate binary file content is not included');
            } finally {
                // Cleanup
                await vscode.workspace.fs.delete(vscode.Uri.file(testFilePath));
            }
        });

        test('Should handle large files correctly', async () => {
            const testFilePath = path.join(__dirname, 'testWorkspace', 'large.txt');
            const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB file
            
            // Create a large file
            await vscode.workspace.fs.writeFile(vscode.Uri.file(testFilePath), Buffer.from(largeContent));

            try {
                const uri = vscode.Uri.file(testFilePath);
                await vscode.commands.executeCommand('snapsource.copyToClipboard', uri);
                
                const clipboardContent = await vscode.env.clipboard.readText();
                assert.ok(clipboardContent.includes('Size (2097152 bytes) exceeds the maximum allowed size'), 
                    'Should indicate file size exceeds limit');
            } finally {
                // Cleanup
                await vscode.workspace.fs.delete(vscode.Uri.file(testFilePath));
            }
        });

        test('Should handle multiple file selection', async () => {
            const testFiles = [
                { name: 'test1.txt', content: 'Test content 1' },
                { name: 'test2.txt', content: 'Test content 2' }
            ];

            const uris = [];
            try {
                // Create test files concurrently
                await Promise.all(testFiles.map(async (file) => {
                    const filePath = path.join(__dirname, 'testWorkspace', file.name);
                    await vscode.workspace.fs.writeFile(
                        vscode.Uri.file(filePath),
                        Buffer.from(file.content)
                    );
                    uris.push(vscode.Uri.file(filePath));
                }));

                // Ensure files are written before proceeding
                await new Promise(resolve => setTimeout(resolve, 100));

                // Test multiple file selection
                await vscode.commands.executeCommand('snapsource.copyToClipboard', uris[0], uris);
                
                // Ensure clipboard is updated before reading
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const clipboardContent = await vscode.env.clipboard.readText();
                assert.ok(clipboardContent.includes('Test content 1'), 'Should include first file content');
                assert.ok(clipboardContent.includes('Test content 2'), 'Should include second file content');
            } finally {
                // Cleanup files concurrently
                await Promise.all(uris.map(async uri => {
                    try {
                        await vscode.workspace.fs.delete(uri);
                    } catch (err) {
                        console.error(`Error deleting test file: ${err.message}`);
                    }
                }));
            }
        });
    });
});