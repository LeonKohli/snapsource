const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

suite('SnapSource Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('LeonKohli.snapsource'));
    });

    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('LeonKohli.snapsource');
        await extension.activate();
        assert.ok(true);
    });

    test('Should register command', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('snapsource.copyToClipboard'));
    });

    test('Should copy file content to clipboard', async function() {
        this.timeout(20000); // Increase timeout for this test
    
        // Create a temporary workspace folder
        const workspaceFolder = path.join(__dirname, 'test-workspace');
        await fs.mkdir(workspaceFolder, { recursive: true });
    
        try {
            // Create a test file
            const testFilePath = path.join(workspaceFolder, 'test.txt');
            await fs.writeFile(testFilePath, 'Test content');
    
            // Open the test file
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);
    
            // Ensure the extension is activated
            const extension = vscode.extensions.getExtension('LeonKohli.snapsource');
            await extension.activate();
    
            // Execute the command
            await vscode.commands.executeCommand('snapsource.copyToClipboard', document.uri);
    
            // Add a delay to ensure clipboard is updated
            await new Promise(resolve => setTimeout(resolve, 3000));
    
            // Get clipboard content
            const clipboardContent = await vscode.env.clipboard.readText();
    
            // Debug output
            console.log('Clipboard content:', clipboardContent);
    
            // Assert
            assert.ok(clipboardContent.includes('Test content'), 'Clipboard should contain test content');
            assert.ok(clipboardContent.includes('Project Structure:'), 'Clipboard should contain project structure');
            assert.ok(clipboardContent.includes('File Contents:'), 'Clipboard should contain file contents');
            assert.ok(clipboardContent.includes('File: test.txt'), 'Clipboard should contain the test file name');
        } catch (error) {
            console.error('Test error:', error);
            throw error;
        } finally {
            // Clean up
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            await fs.rm(workspaceFolder, { recursive: true, force: true });
        }
    });
});