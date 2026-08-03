/**
 * Shrinks the device GLBs for card-sized rendering.
 *
 * The cards draw at 110x120 CSS px, but several source scans ship film-quality
 * assets — iphone15 has 1.65M triangles, airpodsmax carries 95 MB of 4096px
 * textures — so opening a tab meant decoding hundreds of MB for a thumbnail.
 * This decimates geometry to a screen-appropriate budget, caps texture size,
 * and applies meshopt compression (decoder is a plain JS module, so it needs no
 * external decoder files at runtime, unlike Draco).
 *
 * Usage: node scripts/optimize-models.mjs [--dry] [--only=name1,name2]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup, prune, weld, simplify, textureCompress, resample, sparse,
} from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'src/assets/models';
const OUT = process.env.OPT_OUT || 'src/assets/models';

// Only the models actually imported by the app.
const MODELS = [
  's24ultra', 's25ultra', 's26ultra', 'zfold6', 'zflip6',
  'iphone17pro', 'iphone17air', 'iphone16pro', 'iphone15pro', 'iphone16',
  'iphone15', 'iphone12', 'razerbarracuda', 'sonywh1000', 'airpodspro',
  'airpodsmax', 'galaxybuds', 'soundbar', 'ps5_controller', 'xbox_black', 'xbox_white',
];

// Earbud models are animated per-node; simplifying them risks disturbing the
// named lid/bud nodes, and they are already small, so only cap their textures.
const NO_SIMPLIFY = new Set(['galaxybuds', 'airpodspro']);

const TRI_BUDGET = 60000;  // plenty for a 110x120 card
const TEX_SIZE = 1024;

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1].split(',') : null;

await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});

const countTris = (doc) => {
  let t = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      t += idx ? idx.getCount() / 3 : pos ? pos.getCount() / 3 : 0;
    }
  return Math.round(t);
};

fs.mkdirSync(OUT, { recursive: true });
let beforeTotal = 0;
let afterTotal = 0;

for (const name of MODELS) {
  if (only && !only.includes(name)) continue;
  const src = path.join(SRC, `${name}.glb`);
  if (!fs.existsSync(src)) { console.log(`skip ${name} (missing)`); continue; }

  const beforeBytes = fs.statSync(src).size;
  beforeTotal += beforeBytes;

  const doc = await io.read(src);
  const beforeTris = countTris(doc);

  const transforms = [
    dedup(),
    resample(),
    prune({ keepAttributes: false, keepLeaves: false }),
  ];

  if (!NO_SIMPLIFY.has(name) && beforeTris > TRI_BUDGET) {
    // weld() merges coincident vertices so the simplifier can actually collapse
    // edges; without it a triangle soup barely reduces at all.
    transforms.push(weld());
    // `error` is the cap on how far the simplifier may deviate, as a fraction
    // of the model's size. The default (0.001) is meant for close-up viewing
    // and stops collapsing edges almost immediately on dense scans — iphone15
    // only fell from 1.65M to 1.31M triangles. At card size a much looser
    // tolerance is invisible, so allow it to actually reach the budget.
    transforms.push(simplify({
      simplifier: MeshoptSimplifier,
      ratio: Math.max(0.005, TRI_BUDGET / beforeTris),
      error: 0.05,
      lockBorder: false,
    }));
  }

  transforms.push(textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    resize: [TEX_SIZE, TEX_SIZE],
    resizeFilter: 'lanczos3',
  }));
  transforms.push(sparse());

  try {
    await doc.transform(...transforms);
  } catch (e) {
    console.log(`  ! ${name}: transform failed (${e.message.slice(0, 60)}) — texture-only`);
    await doc.transform(textureCompress({
      encoder: sharp, targetFormat: 'webp', resize: [TEX_SIZE, TEX_SIZE],
    }));
  }

  doc.createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

  const afterTris = countTris(doc);
  const dest = path.join(OUT, `${name}.glb`);
  if (!dry) await io.write(dest, doc);
  const afterBytes = dry ? beforeBytes : fs.statSync(dest).size;
  afterTotal += afterBytes;

  console.log(
    `${name.padEnd(16)} ${(beforeBytes / 1048576).toFixed(1).padStart(7)} MB -> ${(afterBytes / 1048576).toFixed(2).padStart(6)} MB   ` +
    `tris ${String(beforeTris).padStart(8)} -> ${String(afterTris).padStart(7)}`
  );
}

console.log(`\nTOTAL ${(beforeTotal / 1048576).toFixed(1)} MB -> ${(afterTotal / 1048576).toFixed(1)} MB`);
