// Web optimisation for the Blender export:  node tools/optimize_glb.mjs <in.glb> <out.glb> [--error 0.0005] [--normal-bits 10]
//   dedup + prune, weld, bounded-error meshopt simplification (fraction of each mesh's radius, so small parts such
//   as screws are left alone), then EXT_meshopt_compression + quantisation.
// The output declares a meshopt *fallback* buffer with no data - that is valid glTF; three.js / drei load it with
// the meshopt decoder (enabled by default in useGLTF).  Naive parsers that ignore the extension will report it as
// broken, which is what led to the earlier "invalid GLB" diagnosis.
import { Logger, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer'

const [input, output] = process.argv.slice(2)
const errArg = process.argv.indexOf('--error')
const error = errArg > 0 ? Number(process.argv[errArg + 1]) : 0.0005
// smooth, glossy parts (the coolant packs) need finer normals than the default 10 bits, or highlights step
const nbArg = process.argv.indexOf('--normal-bits')
const normalBits = nbArg > 0 ? Number(process.argv[nbArg + 1]) : undefined
if (!input || !output) {
  console.error('usage: node tools/optimize_glb.mjs <in.glb> <out.glb> [--error 0.0005]')
  process.exit(1)
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

const triangles = (doc) => {
  let n = 0
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices()
      n += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3
    }
  return n
}

const doc = await io.read(input)
doc.setLogger(new Logger(Logger.Verbosity.ERROR))   // tiled fabric UVs exceed [0,1]; quantize skips them (expected)
const before = triangles(doc)
await doc.transform(
  dedup(),
  prune(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0, error, lockBorder: true }),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium', ...(normalBits ? { quantizeNormal: normalBits } : {}) }),
)
await io.write(output, doc)
const { size } = await import('node:fs').then((fs) => fs.statSync(output))
console.log(`triangles ${before} -> ${triangles(doc)} | ${(size / 1e6).toFixed(2)} MB -> ${output}`)
