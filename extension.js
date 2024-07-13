const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore');

function activate(context) {
    let disposable = vscode.commands.registerCommand('snapsource.copyToClipboard', async (uri, uris) => {
        const config = vscode.workspace.getConfiguration('snapsource');
        const ignoreGitIgnore = config.get('ignoreGitIgnore');
        const maxDepth = config.get('maxDepth');
        const excludePatterns = config.get('excludePatterns');
        const outputFormat = config.get('outputFormat');

        // If multiple items are selected, use those. Otherwise, use the single item.
        const itemsToProcess = uris && uris.length > 0 ? uris : [uri];

        if (itemsToProcess.length > 0) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(itemsToProcess[0]);
            if (workspaceFolder) {
                const ig = ignore().add(excludePatterns);
                ig.add('.*'); // Ignore dot files

                if (ignoreGitIgnore) {
                    const gitIgnorePath = path.join(workspaceFolder.uri.fsPath, '.gitignore');
                    try {
                        const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
                        ig.add(gitIgnoreContent);
                    } catch (error) {
                        // .gitignore file doesn't exist or can't be read, continue without it
                    }
                }

                const projectTree = await getProjectTree(workspaceFolder.uri.fsPath, ig, maxDepth);
                let processedContent = [];

                for (const item of itemsToProcess) {
                    const stats = await fs.stat(item.fsPath);
                    if (stats.isDirectory()) {
                        processedContent.push(...await processDirectory(item.fsPath, workspaceFolder.uri.fsPath, ig));
                    } else {
                        const fileContent = await processFile(item.fsPath, workspaceFolder.uri.fsPath, ig);
                        if (fileContent) processedContent.push(fileContent);
                    }
                }

                const formattedContent = formatOutput(outputFormat, projectTree, processedContent);
                vscode.env.clipboard.writeText(formattedContent);
                vscode.window.showInformationMessage(`Copied project tree and content of non-ignored files to clipboard in ${outputFormat} format!`);
            } else {
                vscode.window.showErrorMessage('Unable to determine workspace folder.');
            }
        } else {
            vscode.window.showErrorMessage('Please select one or more files or folders in the explorer.');
        }
    });

    context.subscriptions.push(disposable);
}

async function getProjectTree(dir, ig, maxDepth, currentDepth = 0, prefix = '') {
    if (currentDepth > maxDepth) return '';

    let result = '';
    const files = await fs.readdir(dir);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(dir, file);
        const relativePath = path.relative(dir, filePath);
        
        if (ig.ignores(relativePath)) continue;

        const stats = await fs.stat(filePath);
        const isLast = i === files.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        
        result += `${prefix}${branch}${file}\n`;
        
        if (stats.isDirectory()) {
            result += await getProjectTree(filePath, ig, maxDepth, currentDepth + 1, prefix + (isLast ? '    ' : '│   '));
        }
    }
    return result;
}

async function processDirectory(dirPath, rootPath, ig) {
    let content = [];
    const files = await fs.readdir(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const relativePath = path.relative(rootPath, filePath);
        
        if (ig.ignores(relativePath)) continue;

        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
            content.push(...await processDirectory(filePath, rootPath, ig));
        } else {
            const fileContent = await processFile(filePath, rootPath, ig);
            if (fileContent) content.push(fileContent);
        }
    }
    return content;
}

async function processFile(filePath, rootPath, ig) {
    const relativePath = path.relative(rootPath, filePath);
    if (ig.ignores(relativePath)) return null;

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        return {
            path: relativePath,
            content: fileContent
        };
    } catch (error) {
        console.error(`Error reading file ${relativePath}:`, error);
        return null;
    }
}

function formatOutput(format, projectTree, content) {
    switch (format) {
        case 'markdown':
            return formatMarkdown(projectTree, content);
        case 'plaintext':
        default:
            return formatPlainText(projectTree, content);
    }
}

function formatMarkdown(projectTree, content) {
    let output = '# Project Structure\n\n```\n' + projectTree + '```\n\n# File Contents\n\n';
    content.forEach(file => {
        output += `## ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
    });
    return output;
}

function formatPlainText(projectTree, content) {
    let output = 'Project Structure:\n\n' + projectTree + '\n\nFile Contents:\n\n';
    content.forEach(file => {
        output += `File: ${file.path}\n\n${file.content}\n\n`;
    });
    return output;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}