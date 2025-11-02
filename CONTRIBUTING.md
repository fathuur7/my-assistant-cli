# Contributing to AI Assistant CLI

Thank you for considering contributing to AI Assistant CLI! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/my-assistant-cli.git
   cd my-assistant-cli
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/fathuur7/my-assistant-cli.git
   ```

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Google Gemini API Key

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Build project
npm run build

# Link for local testing
npm link
```

### Project Structure

```
src/
├── commands/          # CLI commands
│   ├── gen.ts        # Generate command
│   ├── fix.ts        # Fix command
│   └── review.ts     # Review command
├── utills/           # Utilities
│   └── loggers.ts    # Logger helper
test/                 # Test files
bin/                  # Entry points
```

## 🔨 Making Changes

### Create a Branch

```bash
# Always branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

Examples:
- `feature/add-batch-processing`
- `fix/retry-mechanism-error`
- `docs/update-readme`

### Development Workflow

```bash
# Make changes
# ...

# Build and test
npm run build
npm test

# Test locally
aiCli gen "test command"
aiCli fix --auto test.js
aiCli review test.jsx
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or updates
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(gen): add --dry-run flag for command preview

This allows users to preview generated commands without executing them.

Closes #123
```

```bash
fix(fix): resolve retry mechanism infinite loop

The retry logic was not properly handling network timeouts.
Added max retry limit and exponential backoff.

Fixes #456
```

## 🔄 Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Run Tests

```bash
npm run build
npm test
npm run lint
```

### 3. Create Pull Request

- **Title**: Clear and descriptive
- **Description**: Explain what and why
- **Reference**: Link related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

## 🎨 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface CommandOptions {
  auto: boolean
  history: boolean
}

async function executeCommand(options: CommandOptions): Promise<void> {
  // Implementation
}

// ❌ Bad
function executeCommand(options: any) {
  // Implementation
}
```

### Naming Conventions

- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Private members**: prefix with `_`

### Code Style

```typescript
// ✅ Good: Descriptive names, type safety
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  // Implementation
}

// ❌ Bad: Unclear names, no types
async function retry(fn, max, delay) {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const result = await apiCall()
  return result
} catch (error) {
  logger.error('API call failed:', error)
  throw new Error(`Failed to fetch data: ${error.message}`)
}

// ❌ Bad: Silent failures
try {
  await apiCall()
} catch (error) {
  // Silent
}
```

### Documentation

```typescript
/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise resolving to function result
 * @throws Error if all retries fail
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  // Implementation
}
```

## ✅ Testing

### Unit Tests

```typescript
// test/commands/gen.test.ts
import { expect, test } from '@oclif/test'

describe('gen command', () => {
  test
    .stdout()
    .command(['gen', 'create hello.js'])
    .it('generates file creation command', ctx => {
      expect(ctx.stdout).to.contain('New-Item')
    })
})
```

### Manual Testing

```bash
# Test all commands
aiCli gen "create test.js"
aiCli fix --auto test.js
aiCli review test.jsx

# Test history
aiCli gen --history
aiCli fix --history
aiCli review --history

# Test error cases
aiCli fix --auto non-existent.js
aiCli review large-file.jsx  # > 1MB
```

## 🐛 Bug Reports

### Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 11]
- Node.js: [e.g., 18.17.0]
- CLI Version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Template

```markdown
**Feature Description**
Clear description of the feature

**Problem It Solves**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Any other relevant information
```

## 📚 Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [oclif Documentation](https://oclif.io/docs/)
- [Google Gemini AI](https://ai.google.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🙏 Thank You!

Every contribution makes this project better. Thank you for taking the time to contribute! 🎉

---

If you have questions, feel free to:
- Open an issue
- Join discussions
- Contact maintainers

**Happy Coding!** 🚀
