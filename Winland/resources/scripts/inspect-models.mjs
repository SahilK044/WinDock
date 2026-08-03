import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
import path from 'path';

const DIR = 'src/assets/models';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.glb'));
const rows = [];
for (const f of files) {
  const p = path.join(DIR, f);
  const bytes = fs.statSync(p).size;
  try {
    const doc = await io.read(p);
    const root = doc.getRoot();
    let tris = 0;
    for (const mesh of root.listMeshes())
      for (const prim of mesh.listPrimitives()) {
        const idx = prim.getIndices();
        const pos = prim.getAttribute('POSITION');
        tris += idx ? idx.getCount() / 3 : (pos ? pos.getCount() / 3 : 0);
      }
    const texes = root.listTextures();
    let texBytes = 0;
    const dims = [];
    for (const t of texes) {
      const img = t.getImage();
      texBytes += img ? img.byteLength : 0;
      const s = t.getSize();
      if (s) dims.push(`${s[0]}x${s[1]}`);
    }
    rows.push({ f, mb: bytes / 1048576, tris: Math.round(tris), texCount: texes.length,
      texMB: texBytes / 1048576, dims: dims.slice(0, 4).join(',') });
  } catch (e) {
    rows.push({ f, mb: bytes / 1048576, err: e.message.slice(0, 40) });
  }
}
rows.sort((a, b) => b.mb - a.mb);
for (const r of rows) {
  if (r.err) { console.log(`${r.mb.toFixed(1).padStart(7)} MB  ${r.f.padEnd(24)} ERR ${r.err}`); continue; }
  console.log(`${r.mb.toFixed(1).padStart(7)} MB  ${r.f.padEnd(24)} tris=${String(r.tris).padStart(8)}  tex=${String(r.texCount).padStart(3)} (${r.texMB.toFixed(1)} MB) ${r.dims}`);
}
