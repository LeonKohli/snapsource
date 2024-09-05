# Change Log

All notable changes to the "SnapSource" extension will be documented in this file.

## [1.0.7] - 2024-07-26

### Added
- New XML output format
- Option to disable token counting and cost estimation

## [1.0.5] - 2024-07-25

### Added
- Token counting and cost estimation feature
- New settings:
  - `snapsource.llmModel`: Choose the LLM model for token count and cost estimation
  - `snapsource.maxTokens`: Set maximum token limit before warning
  - `snapsource.enableTokenWarning`: Enable/disable token count warning
  - `snapsource.enableTokenCounting`: Enable/disable token counting and cost estimation

### Changed
- Updated output to include token count and estimated cost information

## [1.0.4] - 2024-07-23

### Changed
- Implement `compressCode`
- Implemented a simpler code compression feature that removes extra whitespace and empty lines
- Updated file processing to use the new compression method
- Improved comment removal functionality

## [1.0.3] - 2024-07-23

### Added
- New setting `snapsource.includeProjectTree` to optionally disable project tree generation
- Updated output formatting to respect the new setting

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