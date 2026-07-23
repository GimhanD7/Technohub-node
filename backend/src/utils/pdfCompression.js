const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const DEFAULT_GHOSTSCRIPT_COMMANDS = process.platform === 'win32'
  ? ['gswin64c.exe', 'gswin32c.exe', 'gs.exe']
  : ['gs'];

async function isPdf(filePath) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(5);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return bytesRead === header.length && header.toString('ascii') === '%PDF-';
  } finally {
    await handle.close();
  }
}

async function runGhostscript(inputPath, outputPath) {
  const configuredCommand = process.env.GHOSTSCRIPT_PATH?.trim();
  const commands = configuredCommand ? [configuredCommand] : DEFAULT_GHOSTSCRIPT_COMMANDS;
  let lastError;

  for (const command of commands) {
    try {
      await execFileAsync(command, [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dSAFER',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dDetectDuplicateImages=true',
        '-dCompressFonts=true',
        `-sOutputFile=${outputPath}`,
        inputPath
      ], { windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
      return;
    } catch (error) {
      lastError = error;
      if (error.code !== 'ENOENT') throw error;
    }
  }

  const error = new Error('Ghostscript is required for automatic PDF compression. Install it or set GHOSTSCRIPT_PATH.');
  error.code = 'GHOSTSCRIPT_NOT_FOUND';
  error.cause = lastError;
  throw error;
}

async function compressPdf(filePath) {
  if (!(await isPdf(filePath))) {
    const error = new Error('The uploaded file is not a valid PDF.');
    error.code = 'INVALID_PDF';
    throw error;
  }

  const original = await fs.promises.stat(filePath);
  const parsed = path.parse(filePath);
  const outputPath = path.join(parsed.dir, `${parsed.name}.compressed-${process.pid}-${Date.now()}${parsed.ext}`);

  try {
    await runGhostscript(filePath, outputPath);
    const compressed = await fs.promises.stat(outputPath);

    if (compressed.size > 0 && compressed.size < original.size) {
      await fs.promises.unlink(filePath);
      await fs.promises.rename(outputPath, filePath);
      return { compressed: true, originalSize: original.size, fileSize: compressed.size };
    }

    return { compressed: false, originalSize: original.size, fileSize: original.size };
  } catch (error) {
    const compressionRequired = process.env.PDF_COMPRESSION_REQUIRED?.toLowerCase() === 'true';

    if (error.code === 'GHOSTSCRIPT_NOT_FOUND' && !compressionRequired) {
      console.warn(`[PDF compression] Ghostscript is unavailable; keeping the validated original file: ${parsed.base}`);
      return {
        compressed: false,
        compressionSkipped: true,
        skipReason: 'ghostscript-unavailable',
        originalSize: original.size,
        fileSize: original.size
      };
    }

    throw error;
  } finally {
    await fs.promises.unlink(outputPath).catch(() => {});
  }
}

module.exports = { compressPdf, isPdf };
