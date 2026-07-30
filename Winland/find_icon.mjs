import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\sahil\\.gemini\\antigravity\\brain\\ee79571f-6dc4-46ec-99ba-c687b8d982bd\\.user_uploaded';
const files = fs.readdirSync(dir);
const images = files.map(f => {
  const p = path.join(dir, f);
  const stat = fs.statSync(p);
  return { name: f, path: p, size: stat.size, mtime: stat.mtime };
}).filter(f => f.size > 5000).sort((a, b) => b.mtime - a.mtime);

console.log(JSON.stringify(images[0]));
