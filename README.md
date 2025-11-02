# 🤖 AI Assistant CLI

> **Powerful AI-powered CLI tool** untuk generate commands, fix errors, dan review code menggunakan Google Gemini AI.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Smart Command Generator** - Generate shell commands dari natural language
- 🔧 **Auto Error Fixer** - Deteksi dan fix errors secara otomatis
- 🎨 **Code Review** - Review UI/UX, accessibility, dan best practices
- 📜 **History Tracking** - Track semua operations dengan history
- 🔄 **Retry Mechanism** - Exponential backoff untuk reliability
- 💾 **Auto Backup** - Backup otomatis sebelum modify files
- 🛡️ **File Size Validation** - Prevent crashes dengan file besar
- 🌐 **Cross-Platform** - Support Windows (PowerShell/CMD), Linux, macOS

## 📦 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Configuration](#️-configuration)
- [Examples](#-examples)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)


## 📥 Installation

### Prerequisites

- **Node.js** 18.x atau lebih tinggi
- **npm**, **yarn**, **pnpm**, atau **bun**
- **Google Gemini API Key** ([Get it here](https://aistudio.google.com/app/apikey))

### Option 1: Install from npm (Recommended)

```bash
npm install -g ai-assistant-cli
```

### Option 2: Install from Source

```bash
# Clone repository
git clone https://github.com/fathuur7/my-assistant-cli.git
cd my-assistant-cli

# Install dependencies
npm install

# Build project
npm run build

# Link globally
npm link
```

### Option 3: Use without Installation

```bash
npx ai-assistant-cli gen "create hello world file"
```

## 🚀 Quick Start

### 1. Setup Environment

Buat file `.env` di root project:

```bash
# .env
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.0-flash-exp
```

### 2. Run Your First Command

```bash
# Generate command
aiCli gen "create a React component Button"

# Fix errors automatically
aiCli fix --auto buggy-file.js

# Review code
aiCli review src/components/Button.jsx
```

## 📖 Commands

### `aiCli gen [PROMPT]`

Generate dan execute shell commands dari natural language.

**Flags:**
- `--history` - Show command history
- `--execute` - Auto-execute tanpa konfirmasi
- `--dry-run` - Preview command tanpa execute

**Examples:**
```bash
# Create files
aiCli gen "create file app.js with hello world"

# Install packages
aiCli gen "install react and typescript"

# Complex commands
aiCli gen "create src folder and components subfolder"
```

---

### `aiCli fix [ERROR_MESSAGE]`

Analyze dan fix errors menggunakan AI.

**Flags:**
- `--auto, -a` - Auto-detect errors dengan run file
- `--history, -h` - Show fix history

**Examples:**
```bash
# Manual error fix
aiCli fix src/app.ts "TypeError: cannot read property 'name'"

# Auto-detect and fix
aiCli fix --auto buggy-file.js

# Show history
aiCli fix --history
```

**Auto-detect supports:**
- `.js`, `.mjs` - JavaScript files
- `.ts`, `.tsx` - TypeScript files  
- `.py` - Python files

---

### `aiCli review [FILE_PATH]`

Review web components/pages untuk UI/UX/accessibility issues.

**Flags:**
- `--full, -f` - Full analysis mode
- `--history, -h` - Show review history

**Examples:**
```bash
# Review component
aiCli review src/components/Navbar.jsx

# Full analysis
aiCli review --full index.html

# Show history
aiCli review --history
```

**Supported files:**
- `.jsx`, `.tsx` - React components
- `.vue` - Vue components
- `.svelte` - Svelte components
- `.html` - HTML pages
- `.css`, `.scss` - Stylesheets

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
MODEL_NAME=gemini-2.0-flash-exp  # Default model
MAX_FILE_SIZE_MB=1               # Max file size (default: 1MB)
AUTO_BACKUP=true                 # Auto backup before changes
RETRY_ATTEMPTS=3                 # Max retry attempts
```

### History Files

History disimpan di `~/.gen-cli/`:
```
~/.gen-cli/
  ├── history.json          # Gen command history
  ├── fix-history.json      # Fix command history
  └── review-history.json   # Review command history
```

### Backup Files

Auto-backup dibuat dengan format:
```
original-file.ext.backup
```
## 💡 Examples

### Generate Commands

```bash
# File operations
aiCli gen "create package.json with name and version"
aiCli gen "rename app.js to index.js"
aiCli gen "delete all .log files"

# React/Frontend
aiCli gen "create React component Card with props title and children"
aiCli gen "install tailwindcss and configure it"

# Git operations
aiCli gen "commit all changes with message 'initial commit'"
aiCli gen "create new branch feature/auth"

# Database
aiCli gen "backup database to backup.sql"
```

### Fix Errors

```bash
# Syntax errors
aiCli fix --auto syntax-error.js
# Output: Detects "missing semicolon" and fixes it

# Logic errors
aiCli fix --auto logic-bug.js
# Output: Detects "off-by-one error in loop" and fixes it

# TypeScript errors
aiCli fix src/types.ts "Type 'string' is not assignable to type 'number'"
```

### Review Code

```bash
# React component review
aiCli review src/Button.jsx
# Output: 
# 🔴 Issues:
# 1. Using <div> instead of <button> (accessibility)
# 2. Poor color contrast (WCAG AA fail)
# 3. Missing loading state
# ✅ Fixed: Semantic button, proper contrast, loading indicator

# CSS review
aiCli review styles.css
# Output: Detects responsive issues, suggests mobile-first approach
```

## 🔧 Development

### Setup Development Environment

```bash
# Clone & install
git clone https://github.com/fathuur7/my-assistant-cli.git
cd my-assistant-cli
npm install

# Create .env
cp .env.example .env
# Edit .env with your API key

# Build
npm run build

# Run in dev mode
npm run dev

# Run tests
npm test
```

### Project Structure

```
my-assistant-cli/
├── src/
│   ├── commands/         # Command implementations
│   │   ├── gen.ts       # Generate commands
│   │   ├── fix.ts       # Fix errors
│   │   └── review.ts    # Code review
│   └── utills/
│       └── loggers.ts   # Logging utilities
├── bin/
│   ├── dev.js          # Dev entry point
│   └── run.js          # Production entry point
├── test/               # Test files
├── .env.example        # Environment template
├── package.json
└── README.md
```

### Available Scripts

```bash
npm run build          # Build TypeScript
npm run dev           # Run in development
npm test              # Run tests
npm run lint          # Run ESLint
npm run format        # Format with Prettier
```

## 🚀 Deployment

### Option 1: Publish to npm

```bash
# 1. Update version di package.json
npm version patch  # or minor, major

# 2. Build project
npm run build

# 3. Login to npm
npm login

# 4. Publish
npm publish --access public

# 5. Users can install:
npm install -g ai-assistant-cli
```

### Option 2: GitHub Releases

```bash
# 1. Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. Build distributable
npm run build
npm pack

# 3. Upload .tgz to GitHub Releases

# 4. Users can install:
npm install -g https://github.com/fathuur7/my-assistant-cli/releases/download/v1.0.0/ai-assistant-cli-1.0.0.tgz
```

### Option 3: Docker Container

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENTRYPOINT ["node", "bin/run.js"]
CMD ["--help"]
```

```bash
# Build image
docker build -t ai-assistant-cli .

# Run
docker run -it --rm -v $(pwd):/workspace ai-assistant-cli gen "create hello.js"
```

### Option 4: Binary Executable (pkg)

```bash
# Install pkg
npm install -g pkg

# Build binaries for all platforms
pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64

# Output:
# ai-assistant-cli-win.exe
# ai-assistant-cli-linux
# ai-assistant-cli-macos
```

## 🌐 CI/CD with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

## 📊 Features Comparison

| Feature | gen | fix | review |
|---------|-----|-----|--------|
| AI-Powered | ✅ | ✅ | ✅ |
| History Tracking | ✅ | ✅ | ✅ |
| Auto Backup | ❌ | ✅ | ✅ |
| Retry Mechanism | ❌ | ✅ | ✅ |
| File Size Validation | ❌ | ✅ | ✅ |
| Cross-Platform | ✅ | ✅ | ✅ |

## 🐛 Troubleshooting

### Error: "API Key not found"

```bash
# Check .env file exists
ls -la .env

# Verify API key is set
cat .env | grep GEMINI_API_KEY
```

### Error: "File too large"

```bash
# File melebihi 1MB limit
# Solution: Split file atau increase MAX_FILE_SIZE_MB di .env
```

### Command not found

```bash
# Re-link global command
npm link

# Or use full path
node bin/run.js gen "your command"
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Contribution Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Follow conventional commits

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [oclif](https://oclif.io/)
- Powered by [Google Gemini AI](https://ai.google.dev/)
- TypeScript & Node.js ecosystem

## 📞 Support

- 🐛 [Report Bug](https://github.com/fathuur7/my-assistant-cli/issues)
- 💡 [Request Feature](https://github.com/fathuur7/my-assistant-cli/issues)
- 📧 Email: kopisusu8ip@gmail.com
- 💬 [Discussions](https://github.com/fathuur7/my-assistant-cli/discussions)

---

**Made with ❤️ by [Fathur](https://github.com/fathuur7)**

```
USAGE
  $ my-assistant-cli hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ my-assistant-cli hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/Desktop/my-assistant-cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `my-assistant-cli hello world`

Say hello world

```
USAGE
  $ my-assistant-cli hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ my-assistant-cli hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/Desktop/my-assistant-cli/blob/v0.0.0/src/commands/hello/world.ts)_

## `my-assistant-cli help [COMMAND]`

Display help for my-assistant-cli.

```
USAGE
  $ my-assistant-cli help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for my-assistant-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.34/src/commands/help.ts)_

## `my-assistant-cli plugins`

List installed plugins.

```
USAGE
  $ my-assistant-cli plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ my-assistant-cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/index.ts)_

## `my-assistant-cli plugins add PLUGIN`

Installs a plugin into my-assistant-cli.

```
USAGE
  $ my-assistant-cli plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into my-assistant-cli.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the MY_ASSISTANT_CLI_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the MY_ASSISTANT_CLI_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ my-assistant-cli plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ my-assistant-cli plugins add myplugin

  Install a plugin from a github url.

    $ my-assistant-cli plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ my-assistant-cli plugins add someuser/someplugin
```

## `my-assistant-cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ my-assistant-cli plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ my-assistant-cli plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/inspect.ts)_

## `my-assistant-cli plugins install PLUGIN`

Installs a plugin into my-assistant-cli.

```
USAGE
  $ my-assistant-cli plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into my-assistant-cli.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the MY_ASSISTANT_CLI_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the MY_ASSISTANT_CLI_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ my-assistant-cli plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ my-assistant-cli plugins install myplugin

  Install a plugin from a github url.

    $ my-assistant-cli plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ my-assistant-cli plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/install.ts)_

## `my-assistant-cli plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ my-assistant-cli plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ my-assistant-cli plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/link.ts)_

## `my-assistant-cli plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ my-assistant-cli plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ my-assistant-cli plugins unlink
  $ my-assistant-cli plugins remove

EXAMPLES
  $ my-assistant-cli plugins remove myplugin
```

## `my-assistant-cli plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ my-assistant-cli plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/reset.ts)_

## `my-assistant-cli plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ my-assistant-cli plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ my-assistant-cli plugins unlink
  $ my-assistant-cli plugins remove

EXAMPLES
  $ my-assistant-cli plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/uninstall.ts)_

## `my-assistant-cli plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ my-assistant-cli plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ my-assistant-cli plugins unlink
  $ my-assistant-cli plugins remove

EXAMPLES
  $ my-assistant-cli plugins unlink myplugin
```

## `my-assistant-cli plugins update`

Update installed plugins.

```
USAGE
  $ my-assistant-cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.52/src/commands/plugins/update.ts)_
<!-- commandsstop -->
