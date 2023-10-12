import { Configuration } from "config"
import JSZip from "jszip"

export const SUPPORTED_MIMETYPES = {
  zip: "application/zip",
  json: "application/json",
  yaml: "application/x-yaml",
}
export const CONFIGURATION_FILENAME = "config.yaml"

export type FileValidationStatus = {
  valid: boolean
  message: string
  context: string
  help: string
}

export async function validateFile(file: File): Promise<FileValidationStatus> {
  if (file.size > Configuration.app.maxUploadFileSize) {
    return {
      valid: false,
      message: "File is too large",
      context: `${Math.round(file.size / 1024 / 1024)} MB`,
      help: "Configuration should be kept lightweight, any extra/large file should be bundled as part of the build process.",
    }
  }

  if (!Object.values(SUPPORTED_MIMETYPES).includes(file.type)) {
    return {
      valid: false,
      message: "Unsupported format",
      context: file.type,
      help: `The following file types are supported: ${Object.keys(SUPPORTED_MIMETYPES).join(", ")}.`,
    }
  }

  if (file.type === "application/zip") {
    const hasConfigFile = await JSZip.loadAsync(file).then(content => CONFIGURATION_FILENAME in content.files)
    if (!hasConfigFile) {
      return {
        valid: false,
        message: "Configuration file not found in archive",
        context: "",
        help: 'The archive must contain a "config.yaml" file.',
      }
    }
  }

  return {
    valid: true,
    message: "File is valid",
    context: "",
    help: "",
  }
}
