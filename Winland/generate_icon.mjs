import fs from 'fs';
import path from 'path';

const srcPngPath = 'C:\\Users\\sahil\\.gemini\\antigravity\\brain\\ee79571f-6dc4-46ec-99ba-c687b8d982bd\\.user_uploaded\\media__1785331983522.png';

const buildDir = path.join(process.cwd(), 'build');
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Read source PNG
const pngBuffer = fs.readFileSync(srcPngPath);

// Save PNG icons
fs.writeFileSync(path.join(buildDir, 'icon.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'icon.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);

// Build valid Windows .ico file containing PNG payload
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = ICO
header.writeUInt16LE(1, 4); // 1 Image

const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0); // Width 256
entry.writeUInt8(0, 1); // Height 256
entry.writeUInt8(0, 2); // Color palette
entry.writeUInt8(0, 3); // Reserved
entry.writeUInt16LE(1, 4); // Color planes
entry.writeUInt16LE(32, 6); // Bits per pixel
entry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
entry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

const icoBuffer = Buffer.concat([header, entry, pngBuffer]);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(process.cwd(), 'icon.ico'), icoBuffer);

console.log('Successfully created build/icon.ico and icon.png');
