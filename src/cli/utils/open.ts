import { spawn } from 'node:child_process'
import { platform } from 'node:os'

export function openInBrowser(filePath: string): void {
  const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open'
  const child = spawn(cmd, [filePath], { detached: true, stdio: 'ignore' })
  child.unref()
}
