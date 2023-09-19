import { promises } from "fs"
import path from "path"
import { find } from "./project-root.mjs"

/**
 * Generates index.ts containing `export * from "<module>"` for the modules in MODULES
 */

const ROOT = find().next().directory
const SRCDIR = path.join(ROOT, "src")
const MODULES = ["components", "contexts", "hooks", "types", "utils"]
const EXTS = [".tsx", ".ts", ".jsx", ".js"]

/* eslint-disable no-console */
async function generate() {
  try {
    for (const mod of MODULES) {
      const modPath = path.resolve("", path.join(SRCDIR, mod))
      const dir = await promises.opendir(modPath)
      const lines = []

      for await (const dirent of dir) {
        if (!dirent.isFile) {
          continue
        }
        const filePath = path.parse(dirent.name)
        if (filePath.name === "index" || !EXTS.includes(filePath.ext)) {
          console.log("Skipped", path.join(mod, dirent.name))
          continue
        }

        const template = `export * from "${mod}/${filePath.name}"\n`
        lines.push(template)
      }

      await promises.writeFile(path.join(modPath, "index.ts"), lines, { flag: "w+", encoding: "utf-8" })
    }
  } catch (err) {
    console.error(err)
  }
}

generate()
