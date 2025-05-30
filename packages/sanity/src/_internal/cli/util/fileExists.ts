import fs from 'node:fs/promises'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch (_) {
    return false
  }
}
