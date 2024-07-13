# SnapSource

SnapSource is a powerful Visual Studio Code extension that allows you to easily copy file and folder contents along with the project tree structure to your clipboard. It automatically ignores dot files, respects .gitignore rules, and provides plaintext and markdown output formats. This tool is particularly useful when working with Large Language Models (LLMs) and you need to provide context about your project.

## Features

- Copy contents of files, folders, or multiple selections to your clipboard along with the project tree structure.
- Automatically ignore dot files (like .env, .git) for security and cleanliness.
- Respect .gitignore rules and custom exclude patterns.
- Configurable project tree depth.
- Two output formats: plaintext and markdown.
- Asynchronous processing for improved performance with large directories.
- Robust error handling for various edge cases.

## How to Use

1. Select one or multiple files or folders in the VS Code Explorer.
2. Right-click and select "Copy to Clipboard (SnapSource)" from the context menu.
3. The file/folder content(s) and project tree will be copied to your clipboard, excluding dot files and respecting ignore patterns.
4. Paste the content into your preferred LLM interface.

## Extension Settings

This extension contributes the following settings:

* `snapsource.ignoreGitIgnore`: Respect .gitignore rules when generating the project tree and copying files (default: true)
* `snapsource.maxDepth`: Maximum depth of the project tree (default: 5)
* `snapsource.excludePatterns`: Additional patterns to exclude from the project tree and file copying (default: ["node_modules", "*.log"]). Note: Dot files are always ignored.
* `snapsource.outputFormat`: Output format for the copied content (options: "plaintext", "markdown", default: "plaintext")

## Output Formats

1. Plaintext: A simple text format with clear sections for project structure and file contents.
2. Markdown: A formatted markdown output with code blocks for project structure and file contents.

## Requirements

- Visual Studio Code version 1.91.0 or higher

## Known Issues

None at this time.

## Release Notes

### 1.0.0

- Initial release of SnapSource
- Features include file and folder content copying, project tree generation, .gitignore support, and multiple output formats (plaintext and markdown)

## Feedback and Contributions

If you have any feedback or would like to contribute to the development of SnapSource, please visit our [GitHub repository](https://github.com/yourusername/snapsource).

**Enjoy using SnapSource!**