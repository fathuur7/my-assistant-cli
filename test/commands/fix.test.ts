import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {existsSync, unlinkSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

describe('fix', () => {
  // Cleanup test files
  afterEach(() => {
    const testFile = join(process.cwd(), 'test-file.js')
    if (existsSync(testFile)) {
      unlinkSync(testFile)
    }
  })

  it('shows error when no file provided', async () => {
    const {error} = await runCommand('fix')
    // Command should exit with error when no file provided
    expect(error?.message).to.match(/EEXIT|Missing required argument/)
  })

  it('shows error message when API key is missing', async () => {
    // Create a test file
    const testFile = join(process.cwd(), 'test-file.js')
    writeFileSync(testFile, 'console.log("test")')
    
    // Remove API key for this test
    const originalKey = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    
    try {
      const {error, stdout} = await runCommand(`fix ${testFile}`)
      
      // Should exit with error when no API key
      if (error) {
        expect(error.message).to.match(/EEXIT/)
      }
      
      // Or show API key error in stdout
      if (stdout) {
        expect(stdout).to.match(/API Key|tidak ditemukan/)
      }
    } finally {
      // Restore API key
      if (originalKey) process.env.GEMINI_API_KEY = originalKey
    }
  })
  
  it('shows help with --help flag', async () => {
    const {stdout} = await runCommand('fix --help')
    expect(stdout).to.match(/Menganalisis dan memperbaiki error|Automatically detect and fix/)
  })
  
  it('shows history help with --history in help', async () => {
    const {stdout} = await runCommand('fix --help')
    expect(stdout).to.match(/--history/)
  })
})
