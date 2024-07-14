# Change Log

All notable changes to the "SnapSource" extension will be documented in this file.

## [1.0.2] - 2024-07-14

### Added
- Binary file detection: Binary files are now identified and their content is not included in the output.
- File size limit: Added a new configuration option `snapsource.maxFileSize` to limit the size of files included in the output.

### Improved
- Error handling: Enhanced error handling and reporting for various scenarios.
- Performance: Optimized file and directory processing for better performance with large projects.

### Fixed
- Various minor bugs and edge cases.

## [1.0.1] - 2024-07-13

- Lowered minimum required VS Code version for broader compatibility.

## [1.0.0] - 2024-07-13

- Initial release
- Features include:
  - Copy file and folder contents with project tree structure
  - Plaintext and Markdown output formats
  - Respect .gitignore and custom exclude patterns
  - Configurable project tree depth
  - Automatic dot file ignoring