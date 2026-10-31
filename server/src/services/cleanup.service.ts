import fs from 'fs';
import path from 'path';

export function deleteDirectoryRecursive(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Gagal menghapus folder ${dirPath}:`, err);
    }
  }
}

export function cleanupExpiredFiles(baseDirs: string[], maxAgeMs: number = 2 * 60 * 60 * 1000): void {
  const now = Date.now();

  baseDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return;

    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        try {
          const stat = fs.statSync(itemPath);
          if (now - stat.mtimeMs > maxAgeMs) {
            if (stat.isDirectory()) {
              fs.rmSync(itemPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(itemPath);
            }
          }
        } catch (e) {
          // ignore individual item stat error
        }
      }
    } catch (err) {
      console.error(`Error during cleanup of ${dir}:`, err);
    }
  });
}
