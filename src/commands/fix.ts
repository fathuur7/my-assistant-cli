import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import { confirm } from '@inquirer/prompts'
import { Command, Flags, ux } from '@oclif/core'
import chalk from 'chalk'
import dotenv from 'dotenv'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
// eslint-disable-next-line unicorn/import-style
import * as path from 'node:path'
import { extname } from 'node:path'

import logger from '../utills/loggers.js'

// Load env quietly
process.env.DOTENV_CONFIG_QUIET = 'true'
dotenv.config({ override: false })

interface FileError {
  filePath: string
  line?: number
}

interface FixHistory {
  errorMessage: string
  filePath: string
  fixType: 'auto' | 'manual'
  success: boolean
  timestamp: string
}

// ============================================
// HISTORY MANAGER
// ============================================
class HistoryManager {
  private historyFile: string

  constructor() {
    const homeDir = os.homedir()
    const configDir = path.join(homeDir, '.gen-cli')
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    this.historyFile = path.join(configDir, 'fix-history.json')
  }

  getHistory(): FixHistory[] {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8')
        return JSON.parse(data) as FixHistory[]
      }
    } catch {
      logger.warn('Gagal membaca history.')
    }

    return []
  }

  saveToHistory(filePath: string, errorMessage: string, success: boolean, fixType: 'auto' | 'manual'): void {
    const history = this.getHistory()
    history.unshift({
      errorMessage,
      filePath,
      fixType,
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

export default class Fix extends Command {
  static description = 'Menganalisis dan memperbaiki error di file menggunakan AI (Gemini).'
  static examples = [
    '<%= config.bin %> fix src/app.ts "TypeError: cannot read property name"',
    '<%= config.bin %> fix index.js:45 "undefined is not a function"',
    '<%= config.bin %> fix "EADDRINUSE: port 3000 already in use"',
    '<%= config.bin %> fix --auto test-error.js',
  ]
  static flags = {
    auto: Flags.boolean({
      char: 'a',
      description: 'Auto-detect errors by running the file',
    }),
    history: Flags.boolean({
      char: 'h',
      description: 'Show fix history',
    }),
  }
  static strict = false
  private historyManager = new HistoryManager()

  async run() {
    const { argv, flags } = await this.parse(Fix)
    
    // 1️⃣ Ambil API Key & Nama Model dari .env
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

    // 3️⃣ Handle --auto flag
    if (flags.auto) {
      return this.autoDetectAndFix(argv as string[], API_KEY, MODEL_NAME)
    }

    // 3️⃣ Ambil string error dari argumen CLI
    const errorString = (argv as string[]).join(' ')
    if (!errorString) {
      logger.error('Anda harus memasukkan pesan error untuk dianalisis.')
      logger.info('Contoh: aiCli fix src/app.ts "TypeError: cannot read property"')
      logger.info('Atau gunakan: aiCli fix --auto file.js')
      this.exit(1)
    }

    // 3️⃣ Parse error string untuk mencari file path
    const fileError = this.parseErrorString(errorString)

    // 4️⃣ Baca file jika ada
    let fileContent = ''
    let hasFile = false

    if (fileError.filePath && fs.existsSync(fileError.filePath)) {
      // Validate file size
      if (!this.validateFileSize(fileError.filePath)) {
        this.exit(1)
      }

      try {
        fileContent = fs.readFileSync(fileError.filePath, 'utf8')
        hasFile = true
        logger.info(chalk.cyan(`📄 File ditemukan: ${fileError.filePath}`))
        if (fileError.line) {
          logger.info(chalk.gray(`   Baris: ${fileError.line}`))
        }
      } catch {
        logger.warn(`Gagal membaca file: ${fileError.filePath}`)
      }
    }

    // 5️⃣ Jalankan spinner
    ux.action.start(`🧠 Sedang menganalisis error...`)

    try {
      // 6️⃣ Inisialisasi model Gemini
      const genAI = new GoogleGenerativeAI(API_KEY)
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })

      const generationConfig = {
        maxOutputTokens: 4096,
        temperature: 0.3,
        topK: 1,
        topP: 1,
      }

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]

      // 7️⃣ Prompt AI dengan atau tanpa file
      const prompt = hasFile 
        ? this.buildPromptWithFile(errorString, fileContent, fileError)
        : this.buildPromptWithoutFile(errorString)

      // 8️⃣ Panggil API Gemini dengan retry
      const result = await retryWithBackoff(() =>
        model.generateContent({
          contents: [{ parts: [{ text: prompt }], role: 'user' }],
          generationConfig,
          safetySettings,
        })
      )

      const aiResponse = result.response.text()

      // 9️⃣ Matikan spinner dan tampilkan hasil
      ux.action.stop('✅ Analisis selesai!')

      // 🔟 Parse response untuk fix code
      const fixedCode = this.extractFixedCode(aiResponse)

      if (fixedCode && hasFile) {
        // Tampilkan analisis
        logger.info(chalk.cyan('\n📋 Analisis Error:\n'))
        logger.info(aiResponse.split('```')[0].trim())

        // Tampilkan kode yang diperbaiki
        logger.info(chalk.cyan('\n✨ Kode yang Diperbaiki:\n'))
        logger.box(fixedCode)

        // Tanya apakah ingin apply fix
        const applyFix = await confirm({
          default: false,
          message: chalk.yellow('\n💾 Apakah Anda ingin menerapkan perbaikan ini ke file?'),
        })

        if (applyFix) {
          fs.writeFileSync(fileError.filePath, fixedCode, 'utf8')
          logger.success(`\n✅ File berhasil diperbaiki: ${fileError.filePath}`)
          this.historyManager.saveToHistory(fileError.filePath, errorString, true, 'manual')
        } else {
          logger.warn('\n⚠️  Perbaikan tidak diterapkan.')
          this.historyManager.saveToHistory(fileError.filePath, errorString, false, 'manual')
        }
      } else {
        // Tampilkan analisis saja
        logger.info(chalk.cyan('\n📋 Hasil Analisis:\n'))
        logger.box(aiResponse)
        this.historyManager.saveToHistory('N/A', errorString, true, 'manual')
      }
    } catch (error: unknown) {
      ux.action.stop('❌ Gagal!')
      logger.error('Terjadi kesalahan saat menghubungi Google AI.')
      logger.info((error as Error).message || String(error))
      
      if (hasFile) {
        this.historyManager.saveToHistory(fileError.filePath, errorString, false, 'manual')
      } else {
        this.historyManager.saveToHistory('N/A', errorString, false, 'manual')
      }
    }
  }

  // ============================================
  // AUTO-DETECT AND FIX
  // ============================================
  private async autoDetectAndFix(argv: string[], apiKey: string, modelName: string): Promise<void> {
    const filePath = argv[0]
    
    if (!filePath) {
      logger.error('Anda harus memasukkan file path untuk auto-detect.')
      logger.info('Contoh: aiCli fix --auto test-error.js')
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

    logger.info(chalk.cyan(`🔍 Auto-detecting errors di: ${filePath}`))

    // Detect errors by running/checking the file
    const errorInfo = this.detectErrors(filePath)

    if (!errorInfo) {
      logger.success('✅ Tidak ada error yang terdeteksi!')
      logger.info('File tampaknya sudah berjalan dengan baik.')
      this.exit(0)
    }

    logger.warn(chalk.yellow('\n⚠️  Error terdeteksi:'))
    logger.info(errorInfo.message)

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Start AI analysis
    ux.action.start('🧠 AI sedang menganalisis dan memperbaiki error...')

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: modelName })

      const generationConfig = {
        maxOutputTokens: 4096,
        temperature: 0.3,
        topK: 1,
        topP: 1,
      }

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]

      const prompt = this.buildAutoDetectPrompt(errorInfo.message, fileContent, filePath)

      // Use retry mechanism
      const result = await retryWithBackoff(() => 
        model.generateContent({
          contents: [{ parts: [{ text: prompt }], role: 'user' }],
          generationConfig,
          safetySettings,
        })
      )

      const aiResponse = result.response.text()
      ux.action.stop('✅ Selesai!')

      // Extract fixed code
      const fixedCode = this.extractFixedCode(aiResponse)

      if (fixedCode) {
        logger.info(chalk.cyan('\n📋 Analisis Error:\n'))
        logger.info(aiResponse.split('```')[0].trim())

        logger.info(chalk.cyan('\n✨ Kode yang Diperbaiki:\n'))
        logger.box(fixedCode)

        const applyFix = await confirm({
          default: true,
          message: chalk.yellow('\n💾 Apakah Anda ingin menerapkan perbaikan ini?'),
        })

        if (applyFix) {
          fs.writeFileSync(filePath, fixedCode, 'utf8')
          logger.success(`\n✅ File berhasil diperbaiki: ${filePath}`)
          
          // Re-run untuk verify
          logger.info(chalk.cyan('\n🔍 Memverifikasi perbaikan...'))
          const verifyError = this.detectErrors(filePath)
          
          if (verifyError === null) {
            logger.success('✅ Verifikasi berhasil! Tidak ada error lagi.')
            this.historyManager.saveToHistory(filePath, errorInfo.message, true, 'auto')
          } else {
            logger.warn('⚠️  Masih ada error setelah perbaikan:')
            logger.info(verifyError.message)
            this.historyManager.saveToHistory(filePath, errorInfo.message, false, 'auto')
          }
        } else {
          logger.warn('\n⚠️  Perbaikan tidak diterapkan.')
          this.historyManager.saveToHistory(filePath, errorInfo.message, false, 'auto')
        }
      } else {
        logger.info(chalk.cyan('\n📋 Hasil Analisis:\n'))
        logger.box(aiResponse)
        this.historyManager.saveToHistory(filePath, errorInfo.message, true, 'auto')
      }
    } catch (error: unknown) {
      ux.action.stop('❌ Gagal!')
      logger.error('Terjadi kesalahan saat menghubungi Google AI.')
      logger.info((error as Error).message || String(error))
      this.historyManager.saveToHistory(filePath, errorInfo.message, false, 'auto')
    }
  }

  // ============================================
  // BUILD AUTO-DETECT PROMPT
  // ============================================
  private buildAutoDetectPrompt(errorMessage: string, fileContent: string, filePath: string): string {
    return `Anda adalah "AI Code Fixer" yang ahli dalam debugging dan memperbaiki kode.

**TUGAS ANDA:**
Perbaiki error yang terdeteksi saat menjalankan file ini.

**FILE:** ${filePath}

**ERROR YANG TERDETEKSI:**
${errorMessage}

**CURRENT CODE:**
${fileContent}

**FORMAT JAWABAN:**
1. Jelaskan apa yang salah (typo, logic error, syntax error, dll)
2. Sebutkan penyebab spesifik
3. Berikan FULL FILE CODE yang sudah diperbaiki dalam code block

**PENTING:**
- Berikan SELURUH isi file yang sudah diperbaiki
- Perbaiki semua error yang ada (typo, logic error, missing import, dll)
- Gunakan code block dengan bahasa yang sesuai
- Pastikan indentasi tetap konsisten
- JANGAN hanya memberikan snippet, tapi FULL FILE
- Test logic untuk memastikan benar

Contoh error yang harus diperbaiki:
- Typo dalam nama variabel/fungsi
- Logic error (kondisi if salah, loop infinite, dll)
- Missing import/require
- Syntax error
- Type error
`
  }

  // ============================================
  // BUILD PROMPT WITH FILE
  // ============================================
  private buildPromptWithFile(errorString: string, fileContent: string, fileError: FileError): string {
    return `Anda adalah "AI Code Fixer" yang ahli dalam debugging dan memperbaiki kode.

**TUGAS ANDA:**
1. Analisis error berikut
2. Baca kode yang diberikan
3. Identifikasi masalah
4. Berikan kode yang sudah diperbaiki (FULL FILE)

**ERROR MESSAGE:**
${errorString}

**FILE:** ${fileError.filePath}
${fileError.line ? `**LINE:** ${fileError.line}` : ''}

**CURRENT CODE:**
${fileContent}

**FORMAT JAWABAN:**
1. Jelaskan error secara singkat (2-3 baris)
2. Sebutkan penyebab utama
3. Berikan FULL FILE CODE yang sudah diperbaiki dalam code block (gunakan triple backtick)

**PENTING:**
- Berikan SELURUH isi file yang sudah diperbaiki
- Gunakan code block dengan bahasa yang sesuai
- Pastikan indentasi tetap konsisten
- JANGAN hanya memberikan snippet, tapi FULL FILE
- Pertahankan struktur dan style code yang ada

Contoh format: berikan penjelasan singkat, lalu code block lengkap dengan triple backtick.
`
  }

  // ============================================
  // BUILD PROMPT WITHOUT FILE
  // ============================================
  private buildPromptWithoutFile(errorString: string): string {
    return `
Anda adalah "AI Debugging Assistant" yang ahli.
Analisis pesan error berikut dan berikan solusi terbaik.

**Format jawaban:**
1. **Analisis Error:** (jelaskan arti error ini)
2. **Kemungkinan Penyebab:** (sebutkan 2–3 penyebab utama)
3. **Rekomendasi Solusi:** (langkah perbaikan atau contoh kode)

**Pesan Error:**
"${errorString}"
`
  }

  // ============================================
  // DETECT ERRORS
  // ============================================
  private detectErrors(filePath: string): null | { message: string } {
    const ext = extname(filePath).toLowerCase()
    let command = ''

    try {
      // Tentukan command berdasarkan ekstensi file
      switch (ext) {
        case '.js':
        case '.mjs': {
          command = `node "${filePath}"`
          break
        }

        case '.py': {
          command = `python "${filePath}"`
          break
        }

        case '.ts': {
          // Check if TypeScript is available
          try {
            execSync('tsc --version', { encoding: 'utf8', stdio: 'pipe' })
            command = `tsc --noEmit "${filePath}"`
          } catch {
            // Fallback to ts-node if available
            try {
              execSync('ts-node --version', { encoding: 'utf8', stdio: 'pipe' })
              command = `ts-node "${filePath}"`
            } catch {
              logger.warn('TypeScript atau ts-node tidak ditemukan. Mencoba dengan node...')
              command = `node "${filePath}"`
            }
          }

          break
        }

        default: {
          logger.warn(`File extension ${ext} tidak didukung untuk auto-detect.`)
          return null
        }
      }

      // Run command and capture output
      execSync(command, { encoding: 'utf8', stdio: 'pipe' })
      
      // Jika tidak ada error, return null
      return null
    } catch (error: unknown) {
      // Error terdeteksi!
      const err = error as { message?: string; stderr?: string; stdout?: string }
      const errorOutput = err.stderr || err.stdout || err.message || 'Unknown error'
      
      return {
        message: errorOutput.trim(),
      }
    }
  }

  // ============================================
  // EXTRACT FIXED CODE
  // ============================================
  private extractFixedCode(response: string): null | string {
    // Cari code block (```language ... ```)
    const codeBlockRegex = /```(?:\w+)?\n([\S\s]*?)```/
    const match = response.match(codeBlockRegex)

    if (match && match[1]) {
      return match[1].trim()
    }

    return null
  }

  // ============================================
  // PARSE ERROR STRING
  // ============================================
  private parseErrorString(errorString: string): FileError {
    const fileError: FileError = { filePath: '' }

    // Pattern 1: "file.ts:123 error message"
    const pattern1 = /^([\w./-]+\.(ts|tsx|js|jsx|py|java|cpp|c|go)):(\d+)/
    const match1 = errorString.match(pattern1)
    if (match1) {
      fileError.filePath = match1[1]
      fileError.line = Number.parseInt(match1[3], 10)
      return fileError
    }

    // Pattern 2: "file.ts error message"
    const pattern2 = /^([\w./-]+\.(ts|tsx|js|jsx|py|java|cpp|c|go))/
    const match2 = errorString.match(pattern2)
    if (match2) {
      fileError.filePath = match2[1]
      return fileError
    }

    // Pattern 3: ambil dari kata pertama jika ada ekstensi file
    const words = errorString.split(/\s+/)
    for (const word of words) {
      if (/\.(ts|tsx|js|jsx|py|java|cpp|c|go)$/.test(word)) {
        fileError.filePath = word.replaceAll(/[()[\]{}]/g, '')
        break
      }
    }

    return fileError
  }

  // ============================================
  // SHOW HISTORY
  // ============================================
  private showHistory(): void {
    const history = this.historyManager.getHistory()

    if (history.length === 0) {
      logger.info('📜 Tidak ada history fix.')
      return
    }

    logger.info(chalk.cyan(`\n📜 History Fix (${history.length} terakhir):\n`))

    for (const [index, item] of history.entries()) {
      const icon = item.success ? chalk.green('✓') : chalk.red('✗')
      const type = item.fixType === 'auto' ? chalk.blue('[AUTO]') : chalk.gray('[MANUAL]')
      const date = new Date(item.timestamp).toLocaleString('id-ID', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
      })

      logger.info(`${icon} ${type} ${chalk.cyan(item.filePath)}`)
      logger.info(`   ${chalk.gray(date)} - ${item.errorMessage.slice(0, 80)}${item.errorMessage.length > 80 ? '...' : ''}`)
      
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
