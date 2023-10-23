export const STAGE_NAMES = {
  DELIVERY: "delivery",
  STAGING: "staging",
  PRODUCTION: "production",
} as const

export type StageName = (typeof STAGE_NAMES)[keyof typeof STAGE_NAMES]

export const STAGES_ORDER: StageName[] = ["delivery", "staging", "production"]

export type StageInfo = {
  latestVersion: string
  timestamp: string
  configurationId: string
  repository: string
}
export type StageInfoMap = Partial<Record<StageName, StageInfo>>
