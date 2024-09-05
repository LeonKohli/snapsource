# SnapSource

![SnapSource Logo](images/icon.png)

SnapSource is a powerful Visual Studio Code extension that allows you to easily copy file and folder contents along with the project tree structure to your clipboard. It automatically ignores dot files, respects .gitignore rules, and provides plaintext, markdown, and XML output formats. This tool is particularly useful when working with Large Language Models (LLMs) and you need to provide context about your project.

## 🚀 Features

- 📋 Copy contents of files, folders, or multiple selections to your clipboard along with the project tree structure.
- 🔒 Automatically ignore dot files (like .env, .git) for security and cleanliness.
- 🚫 Respect .gitignore rules and custom exclude patterns.
- 🌳 Configurable project tree depth.
- 📄 Three output formats: plaintext, markdown, and XML.
- ⚡ Asynchronous processing for improved performance with large directories.
- 🛡️ Robust error handling for various edge cases.
- 🧠 Smart binary file detection to exclude non-text content.
- 📏 Configurable file size limit to prevent oversized outputs.
- 🔧 Option to include or exclude project tree structure in the output.
- 🗜️ Simple code compression option for more compact output.
- 🧹 Option to remove comments from code.
- 🔢 Token counting and cost estimation for various LLM models.

## 🔧 How to Use

1. Select one or multiple files or folders in the VS Code Explorer.
2. Right-click and select "Copy to Clipboard (SnapSource)" from the context menu.
3. The file/folder content(s) and project tree (if enabled) will be copied to your clipboard, excluding dot files, binary files, and respecting ignore patterns and size limits.
4. Paste the content into your preferred LLM interface.

## ⚙️ Extension Settings

This extension contributes the following settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `snapsource.ignoreGitIgnore` | Respect .gitignore rules when generating the project tree and copying files | `true` |
| `snapsource.maxDepth` | Maximum depth of the project tree | `5` |
| `snapsource.excludePatterns` | Additional patterns to exclude from the project tree and file copying | `["node_modules", "*.log"]` |
| `snapsource.outputFormat` | Output format for the copied content (options: "plaintext", "markdown", "xml") | `"plaintext"` |
| `snapsource.maxFileSize` | Maximum file size (in bytes) to include in the output | `1048576` (1MB) |
| `snapsource.includeProjectTree` | Include the project tree structure in the output | `true` |
| `snapsource.compressCode` | Remove extra whitespace and empty lines from code when copying | `false` |
| `snapsource.removeComments` | Remove comments from code when copying | `false` |
| `snapsource.llmModel` | LLM model to use for token count and cost estimation | `"gpt-4o"` |
| `snapsource.maxTokens` | Maximum number of tokens allowed before warning | `null` |
| `snapsource.enableTokenWarning` | Enable warning when token count exceeds the maximum | `true` |
| `snapsource.enableTokenCounting` | Enable token counting and cost estimation (requires network access) | `false` |

> **Note:** Dot files are always ignored, and binary files are automatically detected and excluded.

## 📊 Output Formats

1. **Plaintext**: A simple text format with clear sections for project structure (if enabled) and file contents.
2. **Markdown**: A formatted markdown output with code blocks for project structure (if enabled) and file contents.
3. **XML**: A structured XML format with separate sections for project structure and file contents.

## 📋 Requirements

- Visual Studio Code version 1.89.0 or higher

## 🐛 Known Issues

None at this time.

## 📝 Release Notes

### 1.0.7

### Added
- New XML output format
- Option to disable token counting and cost estimation

For a full list of changes, please see the [CHANGELOG.md](CHANGELOG.md) file.

## 💬 Feedback and Contributions

If you have any feedback or would like to contribute to the development of SnapSource, please visit our [GitHub repository](https://github.com/LeonKohli/snapsource).

---

<div align="center">

**Enjoy using SnapSource!**

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/LeonKohli.snapsource.svg?style=for-the-badge&label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=LeonKohli.snapsource)
[![GitHub stars](https://img.shields.io/github/stars/LeonKohli/snapsource.svg?style=for-the-badge&logo=github)](https://github.com/yourusername/snapsource/stargazers)
[![License](https://img.shields.io/github/license/LeonKohli/snapsource.svg?style=for-the-badge)](https://github.com/yourusername/snapsource/blob/main/LICENSE)

</div>