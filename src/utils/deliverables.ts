import { STAGE_NAMES, StageName } from "types"

export function isStageName(obj: unknown): obj is StageName {
  return typeof obj === "string" && Object.values(STAGE_NAMES).includes(obj as StageName)
}
