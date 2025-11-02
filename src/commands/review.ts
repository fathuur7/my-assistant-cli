import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { confirm } from '@inquirer/prompts'
import { Command, Flags, ux } from '@oclif/core'
import chalk from 'chalk'
import dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as os from 'node:os'
// eslint-disable-next-line unicorn/import-style
import * as path from 'node:path'

import logger from '../utills/loggers.js'

// Load env quietly
process.env.DOTENV_CONFIG_QUIET = 'true'
dotenv.config({ override: false })

interface ReviewHistory {
  filePath: string
  fileType: string
  issuesFound: number
  success: boolean
  timestamp: string
}

// ============================================
// HISTORY MANAGER
// ============================================
class ReviewHistoryManager {
  private historyFile: string

  constructor() {
    const homeDir = os.homedir()
    const configDir = path.join(homeDir, '.gen-cli')
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    this.historyFile = path.join(configDir, 'review-history.json')
  }

  getHistory(): ReviewHistory[] {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8')
        return JSON.parse(data) as ReviewHistory[]
      }
    } catch {
      logger.warn('Gagal membaca history.')
    }

    return []
  }

  saveToHistory(filePath: string, fileType: string, issuesFound: number, success: boolean): void {
    const history = this.getHistory()
    history.unshift({
      filePath,
      fileType,
      issuesFound,
      success,
      timestamp: new Date().toISOString(),
    })

    // Simpan maksimal 50 history
    if (history.length > 50) {
      history.splice(50)
    }

    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2))
    } catch {
      logger.warn('Gagal menyimpan history.')
    }
  }
}

// ============================================
// RETRY HELPER
// ============================================
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * (2 ** attempt) // Exponential backoff
        logger.warn(`⚠️  Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`)
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), delay)
        })
      }
    }
  }
  
  throw lastError
}

export default class Review extends Command {
  static description = 'Review web component/page untuk menemukan masalah UI, UX, logic, dan performance menggunakan AI.'
  static examples = [
    '<%= config.bin %> review src/components/Navbar.jsx',
    '<%= config.bin %> review index.html --full',
    '<%= config.bin %> review styles.css',
  ]
  static flags = {
    full: Flags.boolean({
      char: 'f',
      description: 'Full analysis dengan screenshot analisis (jika supported)',
    }),
    history: Flags.boolean({
      char: 'h',
      description: 'Show review history',
    }),
  }
  static strict = false
  private historyManager = new ReviewHistoryManager()

  async run() {
    const { argv, flags } = await this.parse(Review)
    
    // 1️⃣ Ambil API Key & Model
    const API_KEY = process.env.GEMINI_API_KEY
    const MODEL_NAME = process.env.MODEL_NAME || 'gemini-2.0-flash-exp'

    if (!API_KEY) {
      logger.error('❌ API Key Gemini tidak ditemukan.')
      logger.warn('Buat file `.env` dan tambahkan variabel GEMINI_API_KEY=<api_key>.')
      this.exit(1)
    }

    // 2️⃣ Handle --history flag
    if (flags.history) {
      return this.showHistory()
    }

    // 3️⃣ Ambil file path
    const filePath = (argv as string[])[0]
    if (!filePath) {
      logger.error('Anda harus memasukkan file path untuk direview.')
      logger.info('Contoh: aiCli review src/components/Button.jsx')
      this.exit(1)
    }

    if (!fs.existsSync(filePath)) {
      logger.error(`File tidak ditemukan: ${filePath}`)
      this.exit(1)
    }

    // Validate file size
    if (!this.validateFileSize(filePath)) {
      this.exit(1)
    }

    // 3️⃣ Deteksi tipe file
    const fileType = this.detectFileType(filePath)
    logger.info(chalk.cyan(`🔍 Reviewing ${fileType} file: ${filePath}`))

    // 4️⃣ Baca konten
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // 5️⃣ Start AI review
    ux.action.start('🧠 AI sedang menganalisis component/page...')

    try {
      const genAI = new GoogleGenerativeAI(API_KEY)
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })

      const generationConfig = {
        maxOutputTokens: 4096,
        temperature: 0.4,
        topK: 1,
        topP: 1,
      }

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]

      const prompt = this.buildReviewPrompt(fileContent, filePath, fileType, flags.full)

      // Use retry mechanism
      const result = await retryWithBackoff(() =>
        model.generateContent({
          contents: [{ parts: [{ text: prompt }], role: 'user' }],
          generationConfig,
          safetySettings,
        })
      )

      const aiResponse = result.response.text()
      ux.action.stop('✅ Review selesai!')

      // 6️⃣ Parse dan tampilkan hasil
      await this.displayReviewResults(aiResponse, filePath, fileContent, fileType)
    } catch (error: unknown) {
      ux.action.stop('❌ Gagal!')
      logger.error('Terjadi kesalahan saat menghubungi Google AI.')
      logger.info((error as Error).message || String(error))
      this.historyManager.saveToHistory(filePath, fileType, 0, false)
    }
  }

  // ============================================
  // BUILD REVIEW PROMPT
  // ============================================
  private buildReviewPrompt(fileContent: string, filePath: string, fileType: string, fullAnalysis: boolean): string {
    const basePrompt = `Anda adalah "Senior UI/UX & Frontend Expert" yang ahli dalam design, accessibility, dan best practices.

**TUGAS ANDA:**
Review file berikut dan berikan analisis mendalam tentang masalah UI, UX, logic, dan performance.

**FILE:** ${filePath}
**TYPE:** ${fileType}

**CODE:**
${fileContent}

**FOKUS REVIEW:**
1. **UI/Visual Issues:**
   - Layout buruk (flexbox/grid issues)
   - Typography problems
   - Color contrast (accessibility)
   - Spacing/padding issues
   - Responsive design problems

2. **UX Issues:**
   - User flow yang membingungkan
   - Missing feedback (loading, error states)
   - Accessibility (ARIA, keyboard navigation)
   - Mobile experience
   - Click/touch target size

3. **Logic Errors:**
   - State management issues
   - Event handler bugs
   - Conditional rendering problems
   - Props validation

4. **Performance:**
   - Re-render issues
   - Missing memoization
   - Heavy computations
   - Large bundle size

5. **Best Practices:**
   - Semantic HTML
   - Component structure
   - Code organization
   - Security (XSS, etc)

**FORMAT OUTPUT (PENTING - IKUTI PERSIS):**

## 🔴 TOP 3 CRITICAL ISSUES (SINGKAT):
1. [Issue 1] - 1 baris penjelasan
2. [Issue 2] - 1 baris penjelasan  
3. [Issue 3] - 1 baris penjelasan

## 💡 IMPROVEMENTS APPLIED:
- [List 3-5 perbaikan utama dalam 1 baris per item]

\`\`\`${fileType === 'React' ? 'jsx' : fileType.toLowerCase()}
[FULL IMPROVED CODE - Tulis seluruh file yang sudah diperbaiki]
\`\`\`

**ATURAN KETAT:**
- Analisis MAKSIMAL 10 baris total
- FOKUS pada code improvements
- Code block HARUS dimulai dengan triple backtick dan bahasa
- WAJIB berikan FULL FILE (bukan snippet)
- Tambahkan komentar singkat di code untuk highlight perubahan
${fullAnalysis ? '- Berikan detail tambahan jika diminta' : ''}`

    return basePrompt
  }

  // ============================================
  // DETECT FILE TYPE
  // ============================================
  private detectFileType(filePath: string): string {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) return 'React'
    if (filePath.endsWith('.vue')) return 'Vue'
    if (filePath.endsWith('.svelte')) return 'Svelte'
    if (filePath.endsWith('.html')) return 'HTML'
    if (filePath.endsWith('.css') || filePath.endsWith('.scss') || filePath.endsWith('.sass')) return 'CSS'
    if (filePath.endsWith('.js') || filePath.endsWith('.ts')) return 'JavaScript'
    
    return 'Code'
  }

  // ============================================
  // DISPLAY RESULTS
  // ============================================
  private async displayReviewResults(aiResponse: string, filePath: string, originalContent: string, fileType: string): Promise<void> {
    // Tampilkan hasil review
    logger.info(chalk.cyan('\n📋 Review Results:\n'))
    
    // Split response untuk memisahkan analisis dan code
    const parts = aiResponse.split('```')
    
    if (parts.length >= 3) {
      // Ada suggested code
      const analysis = parts[0]
      const improvedCode = parts[1].replace(/^[a-z]+\n/i, '').trim()
      
      // Tampilkan analisis
      logger.box(analysis.trim())
      
      // Tampilkan preview improved code (first 15 lines)
      const codeLines = improvedCode.split('\n')
      const preview = codeLines.slice(0, 15).join('\n')
      const hasMore = codeLines.length > 15
      
      logger.info(chalk.cyan('\n✨ Preview Improved Code (first 15 lines):\n'))
      logger.box(preview + (hasMore ? chalk.gray('\n... (dan ' + (codeLines.length - 15) + ' baris lagi)') : ''))
      
      // Backup original SEBELUM konfirmasi
      const backupPath = `${filePath}.backup`
      fs.writeFileSync(backupPath, originalContent, 'utf8')
      logger.info(chalk.gray(`\n📦 Auto-backup created: ${backupPath}`))
      
      // Tanya apakah mau apply (default TRUE = langsung apply)
      const apply = await confirm({
        default: true,
        message: chalk.yellow('💾 Apply improvements ke file sekarang?'),
      })
      
      if (apply) {
        // Apply improvements
        fs.writeFileSync(filePath, improvedCode, 'utf8')
        logger.success(`\n✅ File berhasil diperbaiki: ${filePath}`)
        logger.info(chalk.cyan('💡 Tips:'))
        logger.info(chalk.gray(`   - Review perubahan dengan: git diff ${filePath}`))
        logger.info(chalk.gray(`   - Restore jika perlu: mv ${backupPath} ${filePath}`))
        logger.info(chalk.gray(`   - Hapus backup jika OK: rm ${backupPath}`))
        
        // Count issues from analysis
        const issuesMatch = analysis.match(/## 🔴 TOP \d+ CRITICAL ISSUES/)?.[0] || ''
        const issueCount = issuesMatch.match(/\d+/)?.[0] ? Number.parseInt(issuesMatch.match(/\d+/)![0], 10) : 0
        
        this.historyManager.saveToHistory(filePath, fileType, issueCount, true)
      } else {
        logger.warn('\n⚠️  Improvements tidak diterapkan.')
        logger.info(chalk.gray(`💡 Backup tetap disimpan di: ${backupPath}`))
        
        const issuesMatch = analysis.match(/## 🔴 TOP \d+ CRITICAL ISSUES/)?.[0] || ''
        const issueCount = issuesMatch.match(/\d+/)?.[0] ? Number.parseInt(issuesMatch.match(/\d+/)![0], 10) : 0
        
        this.historyManager.saveToHistory(filePath, fileType, issueCount, false)
      }
    } else {
      // Hanya analisis tanpa suggested code
      logger.box(aiResponse.trim())
      this.historyManager.saveToHistory(filePath, fileType, 0, true)
    }
  }

  // ============================================
  // SHOW HISTORY
  // ============================================
  private showHistory(): void {
    const history = this.historyManager.getHistory()

    if (history.length === 0) {
      logger.info('📜 Tidak ada history review.')
      return
    }

    logger.info(chalk.cyan(`\n📜 History Review (${history.length} terakhir):\n`))

    for (const [index, item] of history.entries()) {
      const icon = item.success ? chalk.green('✓') : chalk.red('✗')
      const type = chalk.blue(`[${item.fileType}]`)
      const issues = item.issuesFound > 0 ? chalk.yellow(`${item.issuesFound} issues`) : chalk.gray('no issues')
      const date = new Date(item.timestamp).toLocaleString('id-ID', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
      })

      logger.info(`${icon} ${type} ${chalk.cyan(item.filePath)} - ${issues}`)
      logger.info(`   ${chalk.gray(date)}`)
      
      if (index < history.length - 1) {
        logger.info('')
      }
    }
  }

  // ============================================
  // VALIDATE FILE SIZE
  // ============================================
  private validateFileSize(filePath: string, maxSizeMB = 1): boolean {
    const stats = fs.statSync(filePath)
    const fileSizeMB = stats.size / (1024 * 1024)

    if (fileSizeMB > maxSizeMB) {
      logger.error(`❌ File terlalu besar: ${fileSizeMB.toFixed(2)} MB (max: ${maxSizeMB} MB)`)
      return false
    }

    return true
  }
}
