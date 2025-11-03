// src/commands/gen.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { confirm, input } from '@inquirer/prompts'
import { Command, Flags, ux } from '@oclif/core'
import chalk from 'chalk'
import * as dotenv from 'dotenv'
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
// eslint-disable-next-line unicorn/import-style
import * as path from 'node:path'

import logger from '../utills/loggers.js'

// Load env quietly
process.env.DOTENV_CONFIG_QUIET = 'true'
dotenv.config({ override: false })

// ============================================
// INTERFACES & TYPES
// ============================================
interface CommandHistory {
    command: string
    prompt: string
    success: boolean
    timestamp: string
}

interface ContextInfo {
    hasPackageJson: boolean
    os: string
    packageManager: string
    projectType?: string
    shell: string
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
class CommandManager {
    private historyFile: string

    constructor() {
        const homeDir = os.homedir()
        const configDir = path.join(homeDir, '.gen-cli')
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true })
        }

        this.historyFile = path.join(configDir, 'history.json')
    }

    // ============ HISTORY MANAGEMENT ============
    getHistory(): CommandHistory[] {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = fs.readFileSync(this.historyFile, 'utf8')
                return JSON.parse(data) as CommandHistory[]
            }
        } catch {
            logger.warn('Gagal membaca history.')
        }

        return []
    }

    saveToHistory(command: string, prompt: string, success: boolean): void {
        const history = this.getHistory()
        history.unshift({
            command,
            prompt,
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
// CONTEXT DETECTION
// ============================================
const ContextDetector = {
    detect(): ContextInfo {
        const context: ContextInfo = {
            hasPackageJson: false,
            os: os.platform(),
            packageManager: 'npm',
            shell: this.detectShell()
        }

        // Deteksi package.json
        const packageJsonPath = path.join(process.cwd(), 'package.json')
        if (fs.existsSync(packageJsonPath)) {
            context.hasPackageJson = true

            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
                    dependencies?: Record<string, string>
                }
                
                // Deteksi project type
                if (packageJson.dependencies?.next) context.projectType = 'Next.js'
                else if (packageJson.dependencies?.react) context.projectType = 'React'
                else if (packageJson.dependencies?.vue) context.projectType = 'Vue'
                else if (packageJson.dependencies?.express) context.projectType = 'Express'
            } catch {
                // Ignore
            }

            // Deteksi package manager dari lock files
            if (fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
                context.packageManager = 'pnpm'
            } else if (fs.existsSync(path.join(process.cwd(), 'yarn.lock'))) {
                context.packageManager = 'yarn'
            } else if (fs.existsSync(path.join(process.cwd(), 'bun.lockb'))) {
                context.packageManager = 'bun'
            }
        }

        return context
    },

    detectShell(): string {
        // Deteksi shell berdasarkan OS dan environment variables
        const platform = os.platform()
        
        if (platform === 'win32') {
            // Windows: deteksi dari berbagai env vars dan parent process
            const shellEnv = process.env.SHELL || ''
            const comspec = process.env.COMSPEC || ''
            
            // Cek env vars dulu
            if (shellEnv.toLowerCase().includes('powershell') || 
                shellEnv.toLowerCase().includes('pwsh') ||
                process.env.PSModulePath) {
                return 'powershell'
            }
            
            if (comspec.toLowerCase().includes('cmd')) {
                return 'cmd'
            }
            
            // Deteksi dari parent process name jika ada
            try {
                const { ppid } = process
                if (ppid && comspec && comspec.toLowerCase().includes('cmd.exe')) {
                    // Untuk Windows, kita asumsikan cmd jika COMSPEC menunjuk ke cmd.exe
                    return 'cmd'
                }
            } catch {
                // Ignore
            }
            
            // Default Windows ke PowerShell (lebih modern dan umum di Windows 10+)
            return 'powershell'
        }
        
        // Unix-like systems
        const shell = process.env.SHELL || '/bin/bash'
        
        if (shell.includes('bash')) return 'bash'
        if (shell.includes('zsh')) return 'zsh'
        if (shell.includes('fish')) return 'fish'
        
        return 'bash' // default
    },
}

// ============================================
// SAFETY CHECKER
// ============================================
class SafetyChecker {
    private static dangerousCommands = [
        ':(){:|:&};:',  // fork bomb
        '> /dev/sda',
        'chmod -R 777 /',
        'chown -R',
        'dd if=',
        'format',
        'mkfs',
        'rm -rf /',
        'rm -rf *',
    ]
    private static destructiveKeywords = [
        '> /dev/',
        'dd',
        'del /f /s /q',
        'fdisk',
        'format',
        'mkfs',
        'rm -rf',
    ]

    static isBlacklisted(command: string): boolean {
        return this.dangerousCommands.some(dangerous => 
            command.toLowerCase().includes(dangerous.toLowerCase()),
        )
    }

    static isDestructive(command: string): boolean {
        return this.destructiveKeywords.some(keyword => 
            command.toLowerCase().includes(keyword.toLowerCase()),
        )
    }
}

// ============================================
// MAIN COMMAND
// ============================================
export default class Gen extends Command {
    static description = 'Menghasilkan dan menjalankan perintah shell menggunakan AI.'
    static examples = [
        '<%= config.bin %> gen buatkan proyek react baru bernama "my-app"',
        '<%= config.bin %> gen install nextjs dengan tailwind',
        '<%= config.bin %> gen --history',
    ]
    static flags = {
        history: Flags.boolean({ 
            char: 'h', 
            description: 'Tampilkan history perintah',
        }),
    }
    static strict = false
    private manager = new CommandManager()

    async run(): Promise<void> {
        const { argv, flags } = await this.parse(Gen)

        // ============ HANDLE FLAGS ============
        if (flags.history) {
            return this.showHistory()
        }

        // ============ MAIN FLOW ============
        const API_KEY = process.env.GEMINI_API_KEY
        const MODEL_NAME = process.env.MODEL_NAME || 'gemini-2.0-flash-exp'

        if (!API_KEY) {
            logger.error('API Key Gemini tidak ditemukan.')
            logger.warn('Pastikan Anda membuat file .env dan menambahkan GEMINI_API_KEY.')
            this.exit(1)
        }

        // Ambil prompt dari user (HANYA dari argv, tanpa flags)
        let userPrompt = (argv as string[]).join(' ')

        if (userPrompt.length === 0) {
            logger.warn('Prompt AI tidak diberikan.')
            userPrompt = await input({
                message: 'Apa yang ingin Anda lakukan?',
            })
            if (!userPrompt) {
                logger.error('Prompt tidak boleh kosong.')
                this.exit(1)
            }
        }

        // Deteksi context
        const context = ContextDetector.detect()
        
        // Debug info
        logger.info(chalk.gray(`Terdeteksi: OS=${context.os}, Shell=${context.shell}, PM=${context.packageManager}`))
        
        // Generate command dengan AI
        const result = await this.generateCommand(userPrompt, context, API_KEY, MODEL_NAME)
        
        if (!result) {
            this.exit(1)
        }

        const { commands, suggestions } = result

        // Jika ada suggestions, tampilkan
        if (suggestions && suggestions.length > 0) {
            logger.info(chalk.cyan('\n💡 Alternatif Lain:'))
            for (const [i, s] of suggestions.entries()) {
                logger.info(chalk.gray(`   ${i + 1}. ${s}`))
            }
        }

        // Tampilkan command(s)
        await (commands.length === 1 
            ? this.executeSingleCommand(commands[0], userPrompt) 
            : this.executeMultipleCommands(commands, userPrompt))
    }

    // ============================================
    // EXECUTE COMMAND (CORE)
    // ============================================
    private async executeCommand(
        command: string, 
        userPrompt: string,
        isMultiStep = false,
    ): Promise<boolean> {
        
        if (!isMultiStep) {
            logger.info(`🚀 Mengeksekusi: ${command}`)
        }

        // Deteksi shell untuk menentukan executable yang tepat
        const context = ContextDetector.detect()
        let shellExecutable: boolean | string = true
        
        if (context.shell === 'powershell' && context.os === 'win32') {
            // Gunakan PowerShell eksplisit di Windows
            shellExecutable = 'powershell.exe'
        }

        return new Promise((resolve) => {
            const child = spawn(command, [], {
                shell: shellExecutable,
                stdio: 'inherit',
            })

            child.on('error', (error) => {
                logger.error(`Gagal memulai perintah: ${error.message}`)
                this.manager.saveToHistory(command, userPrompt, false)
                resolve(false)
            })

            child.on('close', (code) => {
                const success = code === 0 || code === null
                
                if (!success && !isMultiStep) {
                    logger.error(`Perintah selesai dengan kode error: ${code}`)
                } else if (success && !isMultiStep) {
                    logger.success('Perintah berhasil diselesaikan.')
                }

                this.manager.saveToHistory(command, userPrompt, success)
                resolve(success)
            })
        })
    }

    // ============================================
    // EXECUTE MULTIPLE COMMANDS
    // ============================================
    private async executeMultipleCommands(
        commands: string[], 
        userPrompt: string,
    ): Promise<void> {
        
        logger.info(chalk.cyan(`\n📋 AI menyarankan ${commands.length} langkah:`))
        for (const [i, cmd] of commands.entries()) {
            logger.info(chalk.gray(`   ${i + 1}. ${cmd}`))
        }

        // Safety check for all commands
        const hasDangerous = commands.some(cmd => SafetyChecker.isBlacklisted(cmd))
        if (hasDangerous) {
            logger.error('🛡️  Salah satu perintah termasuk dalam blacklist!')
            this.exit(1)
        }

        const hasDestructive = commands.some(cmd => SafetyChecker.isDestructive(cmd))
        if (hasDestructive) {
            logger.warn(chalk.red('\n⚠️  PERINGATAN: Ada command yang berpotensi merusak!'))
        }

        // Konfirmasi
        const confirmResult = await confirm({
            default: !hasDestructive,
            message: chalk.yellow('Jalankan semua perintah secara berurutan?'),
        })

        if (!confirmResult) {
            logger.warn('Eksekusi dibatalkan oleh pengguna.')
            this.exit(0)
        }

        // Execute sequentially
        for (const [i, cmd] of commands.entries()) {
            logger.info(chalk.cyan(`\n▶️  Step ${i + 1}/${commands.length}: ${cmd}`))
            
            // eslint-disable-next-line no-await-in-loop
            const success = await this.executeCommand(cmd, userPrompt, true)
            
            if (!success) {
                logger.error(`Step ${i + 1} gagal. Menghentikan eksekusi.`)
                
                // Smart suggestion untuk error
                logger.info(chalk.cyan('\n💡 Saran:'))
                logger.info('   - Periksa apakah dependencies sudah terinstall')
                logger.info('   - Coba jalankan ulang command yang gagal')
                logger.info('   - Gunakan --history untuk melihat command sebelumnya')
                
                this.exit(1)
            }
        }

        logger.success('\n✅ Semua langkah berhasil diselesaikan!')
    }

    // ============================================
    // EXECUTE SINGLE COMMAND
    // ============================================
    private async executeSingleCommand(
        command: string, 
        userPrompt: string,
    ): Promise<void> {
        
        // Safety check
        if (SafetyChecker.isBlacklisted(command)) {
            logger.error('🛡️  PERINTAH BERBAHAYA TERDETEKSI!')
            logger.error(`Command "${command}" termasuk dalam blacklist dan tidak akan dieksekusi.`)
            this.exit(1)
        }

        const isDestructive = SafetyChecker.isDestructive(command)

        // Tampilkan command
        logger.info('AI menyarankan untuk menjalankan perintah berikut:')
        logger.box(command)

        if (isDestructive) {
            logger.warn(chalk.red('⚠️  PERINGATAN: Command ini berpotensi merusak/menghapus data!'))
        }

        // Konfirmasi
        const confirmResult = await confirm({
            default: !isDestructive, // false jika destructive
            message: chalk.yellow(
                isDestructive 
                    ? '⚠️  Apakah Anda BENAR-BENAR yakin ingin mengeksekusi perintah ini?' 
                    : 'Apakah Anda yakin ingin mengeksekusi perintah ini?',
            ),
        })

        if (!confirmResult) {
            logger.warn('Eksekusi dibatalkan oleh pengguna.')
            this.exit(0)
        }

        // Execute
        await this.executeCommand(command, userPrompt)
    }

    // ============================================
    // GENERATE COMMAND WITH AI
    // ============================================
    private async generateCommand(
        userPrompt: string, 
        context: ContextInfo,
        apiKey: string,
        modelName: string,
    ): Promise<null | { commands: string[]; suggestions?: string[] }> {
        
        ux.action.start(`🧠 AI sedang memikirkan perintah untuk: "${userPrompt}"`)

        try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: modelName })

            const systemPrompt = `
Anda adalah asisten CLI yang ahli dan context-aware.

INFORMASI KONTEKS:
- OS: ${context.os}
- Shell: ${context.shell}
- Package Manager: ${context.packageManager}
- Ada package.json: ${context.hasPackageJson}
${context.projectType ? `- Project Type: ${context.projectType}` : ''}

TUGAS ANDA:
1. Ubah permintaan manusia menjadi perintah shell yang dapat dieksekusi
2. Gunakan package manager yang terdeteksi (${context.packageManager})
3. Sesuaikan command dengan OS (${context.os}) dan shell (${context.shell})
4. Jika task kompleks, pecah menjadi beberapa step

${context.shell === 'powershell' ? `
PENTING - SINTAKS POWERSHELL:
- Gunakan New-Item untuk membuat file/folder: New-Item -ItemType Directory -Force -Path "src/components"
- Untuk menulis file dengan konten multi-line, gunakan ARRAY dengan -join untuk proper line breaks:
  
  CONTOH BENAR (HTML file): 
  @('<!DOCTYPE html>', '<html lang="en">', '<head>', '  <meta charset="UTF-8">', '  <title>My Page</title>', '</head>', '<body>', '  <h1>Hello</h1>', '</body>', '</html>') -join "\`r\`n" | Out-File -FilePath "index.html" -Encoding utf8
  
  CONTOH BENAR (JS file):
  @('const message = "Hello";', 'console.log(message);') -join "\`r\`n" | Out-File -FilePath "app.js" -Encoding utf8

- PENTING: Gunakan array syntax @('line1', 'line2', 'line3') dengan -join "\`r\`n"
- Setiap line adalah string terpisah dalam array
- Indentasi menggunakan spasi dalam string: '  <meta>' untuk 2 spaces indent
- WAJIB gunakan double quotes untuk string yang berisi single quotes
- Gunakan single quotes untuk string yang berisi double quotes
- JANGAN gunakan mkdir -p (Unix), gunakan New-Item -ItemType Directory -Force
- JANGAN gunakan touch (Unix), gunakan New-Item -ItemType File  
- Gunakan semicolon (;) untuk menggabungkan perintah, bukan &&
` : context.shell === 'cmd' ? `
PENTING - SINTAKS CMD:
- Gunakan mkdir untuk folder (otomatis rekursif di Windows)
- Gunakan echo untuk menulis: echo content > file.txt
- Gunakan & atau && untuk chain commands
- JANGAN gunakan Unix commands seperti touch, rm -rf
` : `
PENTING - SINTAKS UNIX/BASH:
- Gunakan mkdir -p untuk folder rekursif
- Gunakan echo > untuk redirect output
- Gunakan && untuk chain commands
- Gunakan touch untuk membuat file kosong
`}

FORMAT OUTPUT (PENTING!):
Untuk SINGLE command:
COMMAND: <perintah>
SUGGESTIONS: <alternatif1> | <alternatif2> | <alternatif3>

Untuk MULTI-STEP commands:
MULTI_STEP
STEP1: <perintah1>
STEP2: <perintah2>
STEP3: <perintah3>
SUGGESTIONS: <alternatif1> | <alternatif2>

ATURAN:
1. JANGAN berikan penjelasan tambahan
2. JANGAN gunakan markdown
3. Gunakan ${context.packageManager} untuk install packages (npm, yarn, pnpm)
4. SELALU convert natural language ke shell command (install, create, setup, dll adalah valid)
5. Framework installation (React, Next.js, Vue, dll) HARUS generate command
6. Hanya return "ERROR: Bukan perintah shell" jika benar-benar bukan aksi (misal: "apa itu NextJS?", "jelaskan React")
7. SELALU berikan 2-3 suggestions (alternatif command)
8. PASTIKAN command sesuai dengan shell ${context.shell}

CONTOH ${context.shell === 'powershell' ? 'POWERSHELL' : 'BASH'}:
${context.shell === 'powershell' ? `
User: buat file Button di src/components
Output:
COMMAND: @('export default function Button() {', '  return <button>Click me</button>', '}') -join "\`r\`n" | Out-File -FilePath "src/components/Button.jsx" -Encoding utf8
SUGGESTIONS: buat dengan TypeScript | tambahkan props | buat di folder lain

User: install NextJS
Output:
COMMAND: npx create-next-app@latest my-next-app
SUGGESTIONS: install dengan TypeScript | install dengan App Router | install dengan tailwind

User: install react dan axios
Output:
COMMAND: ${context.packageManager} install react react-dom axios
SUGGESTIONS: install dengan TypeScript | tambah react-query | gunakan fetch

User: setup project next.js dengan tailwind
Output:
MULTI_STEP
STEP1: npx create-next-app@latest my-app --tailwind
STEP2: cd my-app
STEP3: ${context.packageManager} install
SUGGESTIONS: menggunakan create-next-app template | manual setup tailwind | tambahkan shadcn
` : `
User: install react dan axios
Output:
COMMAND: ${context.packageManager} install react axios react-dom
SUGGESTIONS: npm install react axios | yarn add react axios | pnpm add react axios

User: install NextJS
Output:
COMMAND: npx create-next-app@latest my-next-app
SUGGESTIONS: with TypeScript | with App Router | with Tailwind

User: setup project next.js dengan tailwind
Output:
MULTI_STEP
STEP1: npx create-next-app@latest my-app
STEP2: cd my-app
STEP3: ${context.packageManager} install -D tailwindcss postcss autoprefixer
STEP4: npx tailwindcss init -p
SUGGESTIONS: menggunakan template next.js tailwind | manual setup tailwind
`}
            `

            const result = await model.generateContent([
                systemPrompt,
                `User: ${userPrompt}`,
                'Anda:',
            ])

            const responseText = result.response.text().trim()

            if (responseText.startsWith('ERROR:')) {
                ux.action.stop('❌ Gagal')
                logger.error(`AI tidak bisa mengubah prompt itu: ${responseText}`)
                return null
            }

            // Parse response
            const parsed = this.parseAIResponse(responseText)
            ux.action.stop('✅ Perintah dibuat!')
            
            return parsed
        } catch (error: unknown) {
            ux.action.stop('❌ Gagal')
            logger.error('Gagal menghubungi API Gemini.')
            logger.info((error as Error).message)
            return null
        }
    }

    // ============================================
    // PARSE AI RESPONSE
    // ============================================
    private parseAIResponse(response: string): { commands: string[]; suggestions?: string[] } {
        const lines = response.split('\n').map(l => l.trim()).filter(Boolean)
        
        const commands: string[] = []
        let suggestions: string[] = []

        if (response.includes('MULTI_STEP')) {
            // Multi-step commands
            for (const line of lines) {
                if (line.startsWith('STEP')) {
                    const cmd = line.split(':').slice(1).join(':').trim()
                    commands.push(cmd)
                } else if (line.startsWith('SUGGESTIONS:')) {
                    const sugg = line.split(':')[1].trim()
                    suggestions = sugg.split('|').map(s => s.trim())
                }
            }
        } else {
            // Single command
            for (const line of lines) {
                if (line.startsWith('COMMAND:')) {
                    commands.push(line.split(':').slice(1).join(':').trim())
                } else if (line.startsWith('SUGGESTIONS:')) {
                    const sugg = line.split(':')[1].trim()
                    suggestions = sugg.split('|').map(s => s.trim())
                }
            }
        }

        return { commands, suggestions }
    }

    // ============================================
    // SHOW HISTORY
    // ============================================
    private async showHistory(): Promise<void> {
        const history = this.manager.getHistory()

        if (history.length === 0) {
            logger.info('Belum ada history.')
            return
        }

        logger.info(chalk.cyan('\n📜 History Perintah (10 terakhir):\n'))

        const recent = history.slice(0, 10)
        
        for (const [index, item] of recent.entries()) {
            const status = item.success ? chalk.green('✓') : chalk.red('✗')
            const time = new Date(item.timestamp).toLocaleString('id-ID')
            
            logger.info(`${status} ${chalk.gray(`[${index + 1}]`)} ${chalk.white(item.command)}`)
            logger.info(chalk.gray(`   Prompt: ${item.prompt}`))
            logger.info(chalk.gray(`   Waktu: ${time}\n`))
        }

        // Opsi: Jalankan ulang dari history?
        const runAgain = await confirm({
            default: false,
            message: 'Ingin menjalankan ulang salah satu command?',
        })

        if (runAgain) {
            const choice = await input({
                message: 'Pilih nomor (1-10):',
                validate(value) {
                    const num = Number.parseInt(value, 10)
                    return num >= 1 && num <= recent.length ? true : 'Nomor tidak valid'
                },
            })

            const selected = recent[Number.parseInt(choice, 10) - 1]
            await this.executeSingleCommand(selected.command, selected.prompt)
        }
    }
}