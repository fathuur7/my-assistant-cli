import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('fix', () => {
  it('runs fix cmd', async () => {
    const {stdout} = await runCommand('fix')
    expect(stdout).to.contain('hello world')
  })

  it('runs fix --name oclif', async () => {
    const {stdout} = await runCommand('fix --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
