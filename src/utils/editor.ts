import { LanguageName, loadLanguage } from "@uiw/codemirror-extensions-langs"

import LANGS from "./languages_cm.json"

type Lang = {
  type: string
  tm_scope: string
  ace_mode: string
  codemirror_mode: LanguageName | "clike"
  codemirror_mime_type: string
  language_id: number
  group?: string
  wrap?: boolean
  aliases?: string[]
  filenames?: string[]
  extensions?: string[]
}

export const ExtensionMap: Record<string, keyof typeof LANGS> = Object.fromEntries(
  Object.entries(LANGS as Record<string, Lang>)
    .map(([key, lang]) => (lang.extensions || []).concat(lang.filenames || []).map(match => [match, key]))
    .flat()
)

export function matchLanguage(filename: string) {
  for (const matcher of Object.keys(ExtensionMap)) {
    if (matcher.startsWith(".") && filename.endsWith(matcher)) {
      return LANGS[ExtensionMap[matcher]] as Lang
    }

    if (filename.includes(matcher)) {
      return LANGS[ExtensionMap[matcher]] as Lang
    }
  }

  return null
}

export function getCodeMirrorMode(filename: string) {
  const match = matchLanguage(filename)
  // This hack is required because the languages package does not define "clike" as a valid mode
  // (which is wrong because CodeMirror supports it)
  return match && loadLanguage(match.codemirror_mode === "clike" ? "c" : match.codemirror_mode)
}
