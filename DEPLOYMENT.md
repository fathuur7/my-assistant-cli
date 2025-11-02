# 🚀 Deployment Guide

Complete guide untuk deploy AI Assistant CLI ke production.

## 📋 Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Code linted (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Documentation updated (README.md, CHANGELOG.md)
- [ ] Version bumped in package.json
- [ ] GEMINI_API_KEY configured
- [ ] Git repository clean (no uncommitted changes)

## 🎯 Deployment Options

### Option 1: npm Registry (Recommended)

#### Setup

1. **Create npm Account**
   ```bash
   # Visit https://www.npmjs.com/signup
   # Or login if you have account
   npm login
   ```

2. **Update package.json**
   ```json
   {
     "name": "ai-assistant-cli",
     "version": "1.0.0",
     "description": "AI-powered CLI tool...",
     "keywords": ["cli", "ai", "gemini"],
     "repository": {
       "type": "git",
       "url": "https://github.com/fathuur7/my-assistant-cli"
     }
   }
   ```

3. **Build & Test**
   ```bash
   npm run build
   npm test
   npm pack  # Test package creation
   ```

4. **Publish**
   ```bash
   # Dry run first
   npm publish --dry-run
   
   # Publish public package
   npm publish --access public
   ```

5. **Verify**
   ```bash
   # Install globally to test
   npm install -g ai-assistant-cli
   aiCli --version
   ```

#### Versioning

Follow [Semantic Versioning](https://semver.org/):

```bash
# Patch release (1.0.0 -> 1.0.1)
npm version patch

# Minor release (1.0.0 -> 1.1.0)
npm version minor

# Major release (1.0.0 -> 2.0.0)
npm version major

# Push tags
git push --follow-tags
```

---

### Option 2: GitHub Releases

#### Manual Release

1. **Create Release Tag**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Build Package**
   ```bash
   npm run build
   npm pack
   ```

3. **Create GitHub Release**
   - Go to: https://github.com/yourusername/my-assistant-cli/releases/new
   - Tag: `v1.0.0`
   - Title: `Release v1.0.0`
   - Description: Copy from CHANGELOG.md
   - Upload: `ai-assistant-cli-1.0.0.tgz`

4. **Users Install**
   ```bash
   npm install -g https://github.com/yourusername/my-assistant-cli/releases/download/v1.0.0/ai-assistant-cli-1.0.0.tgz
   ```

#### Automated with GitHub Actions

GitHub Actions workflow already configured in `.github/workflows/release.yml`

**Usage:**
```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Build project
# 2. Run tests
# 3. Publish to npm
# 4. Create GitHub Release
# 5. Build platform binaries
```

**Setup Secrets:**
1. Go to: Settings → Secrets → Actions
2. Add: `NPM_TOKEN` (from https://www.npmjs.com/settings/tokens)

---

### Option 3: Standalone Binaries

Create standalone executables for each platform.

#### Using pkg

1. **Install pkg**
   ```bash
   npm install -g pkg
   ```

2. **Build Binaries**
   ```bash
   # Build for all platforms
   pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64
   
   # Output:
   # ai-assistant-cli-win.exe
   # ai-assistant-cli-linux
   # ai-assistant-cli-macos
   ```

3. **Test Binary**
   ```bash
   # Windows
   .\ai-assistant-cli-win.exe gen "create hello.js"
   
   # Linux/macOS
   ./ai-assistant-cli-linux gen "create hello.js"
   ```

4. **Distribute**
   - Upload to GitHub Releases
   - Users download and run directly
   - No Node.js required

#### Configure pkg in package.json

```json
{
  "pkg": {
    "targets": ["node18-win-x64", "node18-linux-x64", "node18-macos-x64"],
    "outputPath": "dist-bin"
  }
}
```

---

### Option 4: Docker Container

#### Create Dockerfile

Already provided in project. Build and publish:

```bash
# Build image
docker build -t yourusername/ai-assistant-cli:1.0.0 .
docker build -t yourusername/ai-assistant-cli:latest .

# Test locally
docker run -it --rm \
  -e GEMINI_API_KEY=your_key \
  -v $(pwd):/workspace \
  yourusername/ai-assistant-cli gen "create hello.js"

# Push to Docker Hub
docker login
docker push yourusername/ai-assistant-cli:1.0.0
docker push yourusername/ai-assistant-cli:latest
```

#### Users Run with Docker

```bash
docker pull yourusername/ai-assistant-cli
docker run -it --rm \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  -v $(pwd):/workspace \
  yourusername/ai-assistant-cli gen "your command"
```

---

### Option 5: Private Registry

For internal company use.

#### Verdaccio (Private npm)

```bash
# Install Verdaccio
npm install -g verdaccio

# Run server
verdaccio

# Configure npm
npm set registry http://localhost:4873

# Publish
npm publish
```

#### GitHub Packages

```bash
# Update package.json
{
  "name": "@yourusername/ai-assistant-cli",
  "repository": "https://github.com/yourusername/my-assistant-cli"
}

# Login to GitHub Packages
npm login --registry=https://npm.pkg.github.com

# Publish
npm publish --registry=https://npm.pkg.github.com
```

---

## 🔐 Security Considerations

### API Key Management

**Never commit .env file!**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
```

### For Users

```bash
# Users should create their own .env
GEMINI_API_KEY=their_own_key
```

### For CI/CD

Use GitHub Secrets:
- `NPM_TOKEN` - npm publish token
- `GEMINI_API_KEY` - For testing (optional)

---

## 📊 Monitoring & Analytics

### npm Download Stats

```bash
# Check downloads
npm info ai-assistant-cli

# Or visit
https://www.npmjs.com/package/ai-assistant-cli
```

### GitHub Stats

- Stars, Forks, Issues
- Traffic analytics (Insights → Traffic)

---

## 🔄 Update Strategy

### Publishing Updates

```bash
# 1. Make changes
git commit -am "feat: add new feature"

# 2. Update version
npm version minor  # or patch/major

# 3. Push with tags
git push --follow-tags

# 4. Publish (if not using GitHub Actions)
npm publish
```

### Notify Users

```bash
# Users update with
npm update -g ai-assistant-cli

# Or
npm install -g ai-assistant-cli@latest
```

---

## 🐛 Rollback Strategy

### npm unpublish (within 72 hours)

```bash
# Unpublish specific version
npm unpublish ai-assistant-cli@1.0.1

# Deprecate version (recommended)
npm deprecate ai-assistant-cli@1.0.1 "Use 1.0.2 instead"
```

### GitHub Release

- Edit release → Mark as pre-release
- Delete tag if needed
- Users can pin to specific version

---

## 📝 Post-Deployment

### Verify Deployment

```bash
# Check npm registry
npm info ai-assistant-cli

# Test installation
npm install -g ai-assistant-cli
aiCli --version
aiCli --help

# Test commands
aiCli gen "create test.js"
aiCli fix --auto test.js
aiCli review test.jsx
```

### Update Documentation

- [ ] Update README with installation link
- [ ] Update CHANGELOG
- [ ] Create release notes
- [ ] Announce on social media / Discord / Slack

### Monitor Issues

- Check GitHub Issues
- Monitor npm package page
- Respond to user feedback

---

## 📚 Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Hub](https://hub.docker.com/)
- [pkg Documentation](https://github.com/vercel/pkg)

---

## 🆘 Troubleshooting

### Error: Package name taken

```bash
# Use scoped package
@yourusername/ai-assistant-cli
```

### Error: Authentication failed

```bash
# Re-login
npm logout
npm login
```

### Error: Permission denied

```bash
# Use sudo (not recommended)
sudo npm install -g ai-assistant-cli

# Or fix permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

## ✅ Deployment Checklist

Before each release:

- [ ] Tests passing
- [ ] Linting clean
- [ ] Build successful
- [ ] Documentation updated
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Git tag created
- [ ] Published to npm (if applicable)
- [ ] GitHub release created
- [ ] Binaries built (if applicable)
- [ ] Verified installation
- [ ] Announced to users

---

**Ready to deploy? Follow the steps above and your CLI will be live!** 🚀
