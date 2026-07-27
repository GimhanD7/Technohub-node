const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff']);

async function optimizeImage(filePath, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 82
  } = options;

  const original = await fs.promises.stat(filePath);
  const parsed = path.parse(filePath);
  const outputPath = path.join(
    parsed.dir,
    `${parsed.name}.optimized-${process.pid}-${Date.now()}${parsed.ext || '.img'}`
  );

  try {
    const metadata = await sharp(filePath, { animated: true, failOn: 'warning' }).metadata();
    if (!metadata.format || !SUPPORTED_FORMATS.has(metadata.format)) {
      const error = new Error('The uploaded file is not a supported image.');
      error.code = 'INVALID_IMAGE';
      throw error;
    }

    let pipeline = sharp(filePath, { animated: metadata.pages > 1, failOn: 'warning' })
      .rotate()
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      });

    switch (metadata.format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 4 });
        break;
      case 'gif':
        pipeline = pipeline.gif({ effort: 7, colours: 256 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 4 });
        break;
      case 'tiff':
        pipeline = pipeline.tiff({ quality, compression: 'jpeg' });
        break;
    }

    await pipeline.toFile(outputPath);
    const optimized = await fs.promises.stat(outputPath);

    if (optimized.size > 0 && optimized.size < original.size) {
      await fs.promises.unlink(filePath);
      await fs.promises.rename(outputPath, filePath);
      return {
        optimized: true,
        originalSize: original.size,
        fileSize: optimized.size,
        width: metadata.width,
        height: metadata.height
      };
    }

    return {
      optimized: false,
      originalSize: original.size,
      fileSize: original.size,
      width: metadata.width,
      height: metadata.height
    };
  } finally {
    await fs.promises.unlink(outputPath).catch(() => {});
  }
}

module.exports = { optimizeImage };
