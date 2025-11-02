// src/utils/logger.ts

import boxen, { Options as BoxenOptions } from 'boxen'
import chalk from 'chalk'

/**
 * Pengaturan dasar untuk Boxen
 */
const boxenOptions: BoxenOptions = {
  borderColor: 'cyan',
  borderStyle: 'round',
  margin: { 
    bottom: 1 , 
    top: 1
  },
  padding: { 
    bottom: 1,
    left: 3,
    right: 3,
    top: 1
  },
}

/**
 * Logger utility dengan styling yang cantik
 */
const logger = {
  /**
   * Menampilkan pesan di dalam kotak dengan border
   */
  box(message: string, options?: Partial<BoxenOptions>): void {
    console.log(boxen(chalk.white(message), { ...boxenOptions, ...options }))
  },
  /**
   * Pesan debug (abu-abu)
   */
  debug(message: string): void {
    console.log(chalk.gray(`🔍 [DEBUG] ${message}`))
  },
    /**
     * Pesan error (merah terang)
     */
  error(message: string): void {
    console.log(chalk.red.bold(`❌ ${message}`))
  },
  /**
   * Kotak error (merah)
   */
  errorBox(message: string): void {
    console.log(
      boxen(chalk.red(message), {
        ...boxenOptions,
        borderColor: 'red',
        title: '❌ Error',
        titleAlignment: 'center',
      })
    )
  },
  /**
   * Pesan info standar (biru muda)
   */
  info(message: string): void {
    console.log(chalk.cyan(`ℹ️  ${message}`))
  },
  /**
   * Kotak info (biru)
   */
  infoBox(message: string): void {
    console.log(
      boxen(chalk.cyan(message), {
        ...boxenOptions,
        borderColor: 'cyan',
        title: 'ℹ️ Info',
        titleAlignment: 'center',
      })
    )
  },
  /**
   * Loading spinner message
   */
  loading(message: string): void {
    console.log(chalk.blue(`⏳ ${message}...`))
  },
  /**
   * Blank line
   */
  newLine(): void {
    console.log()
  },
  /**
   * Line separator
   */
  separator(): void {
    console.log(chalk.gray('─'.repeat(50)))
  },
  /**
   * Pesan sukses (hijau dengan icon)
   */
  success(message: string): void {
    console.log(chalk.green.bold(`✅ ${message}`))
  },
  /**
   * Kotak sukses (hijau)
   */
  successBox(message: string): void {
    console.log(
      boxen(chalk.green.bold(message), {
        ...boxenOptions,
        borderColor: 'green',
        title: '✅ Success',
        titleAlignment: 'center',
      })
    )
  },
  /**
   * Judul section (bold dan underline)
   */
  title(message: string): void {
    console.log(chalk.bold.magenta(`\n${message}`))
    console.log(chalk.magenta('─'.repeat(message.length)))
  },
  /**
   * Pesan peringatan (kuning)
   */
  warn(message: string): void {
    console.log(chalk.yellow.bold(`⚠️  ${message}`))
  },
}

export default logger

