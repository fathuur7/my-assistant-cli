# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of AI Assistant CLI

## [1.0.0] - 2025-11-02

### Added
- **gen command**: Generate shell commands from natural language
  - Cross-platform support (Windows PowerShell, CMD, Linux, macOS)
  - Command history tracking
  - Auto-detect package manager (npm, yarn, pnpm, bun)
  - Context-aware command generation
  
- **fix command**: Auto-detect and fix code errors
  - `--auto` flag for automatic error detection
  - Support for JavaScript, TypeScript, Python files
  - Retry mechanism with exponential backoff
  - Fix history tracking
  - File size validation (max 1MB)
  - Auto-backup before modifications
  
- **review command**: Review web components for UI/UX issues
  - Support for React, Vue, Svelte, HTML, CSS
  - Analyze 5 categories: UI, UX, Logic, Performance, Best Practices
  - Accessibility & WCAG compliance checks
  - Auto-apply improvements with confirmation
  - Review history tracking
  - File size validation
  
- **History Management**
  - Track all commands, fixes, and reviews
  - Persistent storage in `~/.gen-cli/`
  - Display with icons, timestamps, and details
  - Max 50 items per command type

- **Error Handling**
  - Exponential backoff retry (max 3 attempts)
  - Graceful error messages
  - Network failure recovery
  - API quota handling

- **Safety Features**
  - Auto-backup before file modifications
  - File size validation (prevent crashes)
  - Confirmation prompts for destructive operations
  - Backup file creation with `.backup` extension

### Technical
- Built with TypeScript & oclif framework
- Powered by Google Gemini 2.0 Flash Exp
- Cross-platform shell detection
- Environment variable configuration
- Comprehensive error handling

### Documentation
- Complete README with examples
- CONTRIBUTING guide for developers
- LICENSE (MIT)
- GitHub Actions CI/CD workflows
- API documentation in code

## [0.1.0] - 2025-10-15 (Beta)

### Added
- Initial prototype with basic gen command
- Basic error fixing capability
- Simple command history

### Known Issues
- Windows PowerShell commands not working correctly
- No retry mechanism for API failures
- Missing file size validation

---

## Version History

- **1.0.0** - Full production release with all features
- **0.1.0** - Initial beta release

## Future Roadmap

### [1.1.0] - Planned
- [ ] Batch processing for multiple files
- [ ] Git integration (auto-commit after fixes)
- [ ] Colorful diff preview
- [ ] Custom prompt templates
- [ ] Config file support (`.aiclirc`)

### [1.2.0] - Planned
- [ ] Plugin system for extensions
- [ ] VS Code extension integration
- [ ] Web dashboard for history visualization
- [ ] Team collaboration features
- [ ] Custom AI model support

### [2.0.0] - Future
- [ ] Local model support (offline mode)
- [ ] Multi-file context awareness
- [ ] Project-wide refactoring
- [ ] Intelligent code suggestions
- [ ] Performance profiling integration

---

## Links

- [GitHub Repository](https://github.com/fathuur7/my-assistant-cli)
- [npm Package](https://www.npmjs.com/package/ai-assistant-cli)
- [Documentation](https://github.com/fathuur7/my-assistant-cli#readme)
- [Issue Tracker](https://github.com/fathuur7/my-assistant-cli/issues)
