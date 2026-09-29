import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height, r, g, b) {
  // Simple solid color PNG generator with crc32
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crcBuf]);
  }
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type 2 (RGB)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  // Image data: scanlines with filter 0
  const scanline = Buffer.alloc(1 + width * 3);
  scanline[0] = 0; // filter 0
  for (let x = 0; x < width; x++) {
    // simple accent shape in center
    const cx = x - width / 2;
    const isCenter = Math.abs(cx) < width * 0.3;
    scanline[1 + x * 3] = isCenter ? 23 : r;
    scanline[1 + x * 3 + 1] = isCenter ? 105 : g;
    scanline[1 + x * 3 + 2] = isCenter ? 244 : b;
  }
  
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(scanline);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rawData));
  
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/icon-192.png', createPNG(192, 192, 8, 27, 53));
fs.writeFileSync('public/icon-512.png', createPNG(512, 512, 8, 27, 53));
fs.writeFileSync('public/icon-maskable.png', createPNG(512, 512, 8, 27, 53));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 8, 27, 53));
console.log('PNG icons created successfully');
