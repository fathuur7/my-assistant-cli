# 🚀 Quick Start Guide

Get started with AI Assistant CLI in 5 minutes!

## Step 1: Install Node.js

Download and install Node.js 18 or higher from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version  # Should be v18.0.0 or higher
npm --version
```

## Step 2: Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

## Step 3: Install AI Assistant CLI

Choose one method:

### Option A: From npm (Recommended)
```bash
npm install -g ai-assistant-cli
```

### Option B: From Source
```bash
git clone https://github.com/fathuur7/my-assistant-cli.git
cd my-assistant-cli
npm install
npm run build
npm link
```

## Step 4: Configure API Key

Create `.env` file in your home directory or project:

```bash
# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

Or set environment variable:

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```

**Linux/macOS:**
```bash
export GEMINI_API_KEY="your_api_key_here"
```

## Step 5: Run Your First Command

```bash
# Test installation
aiCli --version

# Generate a command
aiCli gen "create a hello world JavaScript file"

# Fix errors automatically
aiCli fix --auto buggy-file.js

# Review code
aiCli review component.jsx
```

## 🎯 Common Use Cases

### 1. File Operations
```bash
aiCli gen "create folder src/components"
aiCli gen "rename app.js to index.js"
```

### 2. Package Management
```bash
aiCli gen "install react and typescript"
aiCli gen "initialize npm project"
```

### 3. Error Fixing
```bash
# Auto-detect and fix
aiCli fix --auto index.js

# Manual error fix
aiCli fix app.ts "Cannot find module 'fs'"
```

### 4. Code Review
```bash
# Review React component
aiCli review src/Button.jsx

# Review with full analysis
aiCli review --full src/Navbar.jsx
```

### 5. History
```bash
# View command history
aiCli gen --history
aiCli fix --history
aiCli review --history
```

## 💡 Pro Tips

### 1. Use Aliases
```bash
# Linux/macOS (~/.bashrc or ~/.zshrc)
alias ai="aiCli"

# Windows (PowerShell profile)
Set-Alias ai aiCli

# Now use:
ai gen "create file"
```

### 2. Project-specific .env
```bash
# Create .env in your project root
cd my-project
echo "GEMINI_API_KEY=your_key" > .env

# Commands will automatically use this .env
aiCli gen "create component"
```

### 3. Combine with Git
```bash
# Generate and commit
aiCli gen "create README.md with project info"
git add README.md
git commit -m "docs: add README"
```

## 🐛 Troubleshooting

### Command not found
```bash
# Re-link global package
npm link

# Or use full path
node ./bin/run.js gen "your command"
```

### API Key Error
```bash
# Verify .env exists
cat .env  # Linux/macOS
type .env  # Windows

# Check if key is set
echo $GEMINI_API_KEY
```

### Permission Denied
```bash
# Windows: Run as Administrator
# Linux/macOS: Use sudo
sudo npm install -g ai-assistant-cli
```

## 📚 Next Steps

- Read [Full Documentation](README.md)
- Check [Examples](README.md#examples)
- Learn about [Deployment](DEPLOYMENT.md)
- Contribute via [CONTRIBUTING.md](CONTRIBUTING.md)

## 🆘 Need Help?

- 📖 [Documentation](README.md)
- 🐛 [Report Issues](https://github.com/fathuur7/my-assistant-cli/issues)
- 💬 [Discussions](https://github.com/fathuur7/my-assistant-cli/discussions)

---

**Happy Coding!** 🎉
