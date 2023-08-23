import { promises } from "fs"
import path from "path"

/**
 * Generates index.ts containing `export * from "<module>"` for the modules in MODULES
 */

const SRCDIR = "src"
const MODULES = ["components", "contexts", "hooks", "types", "utils"]

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
        const name = path.parse(dirent.name).name
        if (name === "index") {
          continue
        }

        const template = `export * from "${mod}/${name}"\n`
        lines.push(template)
      }

      await promises.writeFile(path.join(modPath, "index.ts"), lines, { flag: "w+", encoding: "utf-8" })
    }
  } catch (err) {
    console.error(err)
  }
}

generate()
