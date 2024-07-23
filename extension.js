const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore');
const isBinaryFile = require('isbinaryfile').isBinaryFile;

function activate(context) {
    let disposable = vscode.commands.registerCommand('snapsource.copyToClipboard', async (uri, uris) => {
        try {
            const config = vscode.workspace.getConfiguration('snapsource');
            const ignoreGitIgnore = config.get('ignoreGitIgnore');
            const maxDepth = config.get('maxDepth');
            const excludePatterns = config.get('excludePatterns');
            const outputFormat = config.get('outputFormat');
            const maxFileSize = config.get('maxFileSize') || 1024 * 1024; // Default to 1MB
            const includeProjectTree = config.get('includeProjectTree') || true;
            const compressCode = config.get('compressCode') || false;
            const removeComments = config.get('removeComments') || false;

            const itemsToProcess = uris && uris.length > 0 ? uris : [uri];

            if (itemsToProcess.length > 0) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(itemsToProcess[0]);
                if (workspaceFolder) {
                    const ig = ignore().add(excludePatterns);
                    ig.add('.*'); // Ignore dot files

                    if (ignoreGitIgnore) {
                        await addGitIgnoreRules(workspaceFolder.uri.fsPath, ig);
                    }

                    let projectTree = '';
                    if (includeProjectTree) {
                        projectTree = await getProjectTree(workspaceFolder.uri.fsPath, ig, maxDepth);
                    }
                    let processedContent = [];

                    for (const item of itemsToProcess) {
                        const stats = await fs.stat(item.fsPath);
                        if (stats.isDirectory()) {
                            processedContent.push(...await processDirectory(item.fsPath, workspaceFolder.uri.fsPath, ig, maxFileSize, compressCode, removeComments));
                        } else {
                            const fileContent = await processFile(item.fsPath, workspaceFolder.uri.fsPath, ig, maxFileSize, compressCode, removeComments);
                            if (fileContent) processedContent.push(fileContent);
                        }
                    }

                    const formattedContent = formatOutput(outputFormat, projectTree, processedContent);
                    await vscode.env.clipboard.writeText(formattedContent);
                    vscode.window.showInformationMessage(`Copied ${includeProjectTree ? 'project tree and ' : ''}content of non-ignored files to clipboard in ${outputFormat} format!`);
                } else {
                    throw new Error('Unable to determine workspace folder.');
                }
            } else {
                throw new Error('Please select one or more files or folders in the explorer.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function addGitIgnoreRules(rootPath, ig) {
    const gitIgnorePath = path.join(rootPath, '.gitignore');
    try {
        const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
        ig.add(gitIgnoreContent);
    } catch (error) {
        console.log('.gitignore not found or not readable:', error.message);
    }
}

async function getProjectTree(dir, ig, maxDepth, currentDepth = 0, prefix = '') {
    if (currentDepth > maxDepth) return '';

    let result = '';
    try {
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
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
    return result;
}

async function processDirectory(dirPath, rootPath, ig, maxFileSize, compressCode, removeComments) {
    let content = [];
    try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const relativePath = path.relative(rootPath, filePath);
            
            if (ig.ignores(relativePath)) continue;

            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                content.push(...await processDirectory(filePath, rootPath, ig, maxFileSize, compressCode, removeComments));
            } else {
                const fileContent = await processFile(filePath, rootPath, ig, maxFileSize, compressCode, removeComments);
                if (fileContent) content.push(fileContent);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dirPath}:`, error);
    }
    return content;
}

async function processFile(filePath, rootPath, ig, maxFileSize, compressCode, removeComments) {
    const relativePath = path.relative(rootPath, filePath);
    if (ig.ignores(relativePath)) return null;

    try {
        const stats = await fs.stat(filePath);
        if (stats.size > maxFileSize) {
            return {
                path: relativePath,
                content: `[File content not included. Size (${stats.size} bytes) exceeds the maximum allowed size (${maxFileSize} bytes)]`
            };
        }

        const isBinary = await isBinaryFile(filePath);
        if (isBinary) {
            return {
                path: relativePath,
                content: '[Binary file content not included]'
            };
        }

        let fileContent = await fs.readFile(filePath, 'utf8');

        if (removeComments || compressCode) {
            fileContent = processContent(fileContent, removeComments, compressCode);
        }

        return {
            path: relativePath,
            content: fileContent
        };
    } catch (error) {
        console.error(`Error processing file ${relativePath}:`, error);
        return {
            path: relativePath,
            content: `[Error reading file: ${error.message}]`
        };
    }
}

function processContent(content, removeComments, compressCode) {
    if (removeComments) {
        content = removeCodeComments(content);
    }
    
    if (compressCode) {
        content = compressCodeContent(content);
    }
    
    return content;
}

function removeCodeComments(content) {
    return content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
}

function compressCodeContent(content) {
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join('\n');
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
    let output = '';
    if (projectTree) {
        output += '# Project Structure\n\n```\n' + projectTree + '```\n\n';
    }
    output += '# File Contents\n\n';
    content.forEach(file => {
        const fileExtension = path.extname(file.path).slice(1);
        const language = fileExtension ? fileExtension : '';
        output += `## ${file.path}\n\n\`\`\`${language}\n${file.content}\n\`\`\`\n\n`;
    });
    return output;
}

function formatPlainText(projectTree, content) {
    let output = '';
    if (projectTree) {
        output += 'Project Structure:\n\n' + projectTree + '\n\n';
    }
    output += 'File Contents:\n\n';
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