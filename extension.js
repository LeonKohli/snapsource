const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore').default;
const isBinaryFile = require('isbinaryfile').isBinaryFile;
const { tokenizeAndEstimateCost } = require('llm-cost');

const MODEL_MAX_TOKENS = {
    "gpt-4": 8192,
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "claude-3-5-sonnet-20240620": 200000,
    "claude-3-opus-20240229": 200000
};

function activate(context) {
    let disposable = vscode.commands.registerCommand('snapsource.copyToClipboard', async (uri, uris) => {
        try {
            const config = vscode.workspace.getConfiguration('snapsource');
            const ignoreGitIgnore = config.get('ignoreGitIgnore');
            const maxDepth = config.get('maxDepth');
            const excludePatterns = config.get('excludePatterns');
            const outputFormat = config.get('outputFormat');
            const maxFileSize = config.get('maxFileSize') || 1024 * 1024; // Default to 1MB
            const includeProjectTree = config.get('includeProjectTree');
            const compressCode = config.get('compressCode') || false;
            const removeComments = config.get('removeComments') || false;
            const llmModel = config.get('llmModel') || 'gpt-4';
            const maxTokens = config.get('maxTokens');
            const enableTokenWarning = config.get('enableTokenWarning');
            const enableTokenCounting = config.get('enableTokenCounting') || false;

            const itemsToProcess = uris && uris.length > 0 ? uris : [uri];

            if (itemsToProcess.length > 0) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(itemsToProcess[0]);
                if (workspaceFolder) {
                    const ig = ignore().add(excludePatterns).add('.*');

                    if (ignoreGitIgnore) {
                        await addGitIgnoreRules(workspaceFolder.uri.fsPath, ig);
                    }

                    let projectTree = includeProjectTree ? await getProjectTree(workspaceFolder.uri.fsPath, ig, maxDepth) : '';
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
                    
                    if (enableTokenCounting) {
                        const { inputTokens, cost } = await tokenizeAndEstimateCost({
                            model: llmModel,
                            input: formattedContent,
                            output: ''
                        });

                        await vscode.env.clipboard.writeText(formattedContent);

                        let message = `Copied to clipboard: ${outputFormat} format, ${inputTokens} tokens, $${cost.toFixed(4)} est. cost`;

                        if (enableTokenWarning) {
                            const tokenLimit = maxTokens !== null ? maxTokens : (MODEL_MAX_TOKENS[llmModel] || 0);
                            if (tokenLimit > 0 && inputTokens > tokenLimit) {
                                message += `\nWARNING: Token count (${inputTokens}) exceeds the set limit (${tokenLimit}).`;
                                vscode.window.showWarningMessage(message);
                            } else {
                                vscode.window.showInformationMessage(message);
                            }
                        } else {
                            vscode.window.showInformationMessage(message);
                        }
                    } else {
                        await vscode.env.clipboard.writeText(formattedContent);
                        vscode.window.showInformationMessage(`Copied to clipboard: ${outputFormat} format`);
                    }
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
        case 'xml':
            return formatXML(projectTree, content);
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

function formatXML(projectTree, content) {
    let output = '<?xml version="1.0" encoding="UTF-8"?>\n<snapsource>\n';
    
    if (projectTree) {
        output += '  <project_structure>\n';
        output += projectTree.split('\n').map(line => '    ' + line).join('\n');
        output += '  </project_structure>\n\n';
    }
    
    output += '  <file_contents>\n';
    content.forEach(file => {
        output += `    <file path="${escapeXML(file.path)}">\n`;
        output += `      <![CDATA[${file.content}]]>\n`;
        output += '    </file>\n';
    });
    output += '  </file_contents>\n';
    
    output += '</snapsource>';
    return output;
}

function escapeXML(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}