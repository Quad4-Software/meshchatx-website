// Tiny image dimension reader for build-time use. Parses PNG, JPEG, WebP,
// and SVG headers without dependencies.
import { readFileSync } from 'node:fs';

export function imageSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  if (buf.length < 32) return { width: 0, height: 0 };

  // PNG: 8-byte signature then IHDR with big-endian w/h
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: scan segments for SOF0/1/2
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) {
        off++;
        continue;
      }
      const marker = buf[off + 1]!;
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buf.readUInt16BE(off + 7), height: buf.readUInt16BE(off + 5) };
      }
      off += 2 + len;
    }
  }

  // WebP RIFF
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (fmt === 'VP8X') {
      const w = buf[24]! | (buf[25]! << 8) | (buf[26]! << 16);
      const h = buf[27]! | (buf[28]! << 8) | (buf[29]! << 16);
      return { width: w + 1, height: h + 1 };
    }
  }

  // SVG: width/height attrs or viewBox
  if (buf.toString('utf8', 0, 5).includes('<') ) {
    const text = buf.toString('utf8');
    const w = text.match(/\bwidth="([\d.]+)/);
    const h = text.match(/\bheight="([\d.]+)/);
    if (w && h) return { width: parseFloat(w[1]!), height: parseFloat(h[1]!) };
    const vb = text.match(/viewBox="[\d.\s-]+?\s([\d.]+)\s([\d.]+)"/);
    if (vb) return { width: parseFloat(vb[1]!), height: parseFloat(vb[2]!) };
  }

  return { width: 0, height: 0 };
}
