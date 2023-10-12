import { Logger } from "@iotinga/ts-backpack-common"
import axios, { AxiosInstance } from "axios"
import { Configuration } from "config"
import { JobRequest, JobResponse } from "types"

const logger = new Logger("CliAPI")

export class CliAPI {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: Configuration.backend.v1,
    })
  }

  async uploadConfiguration(
    project: string,
    deliverable: string,
    stage: string,
    filename: string,
    attachment_name: string,
    attachment: Blob
  ) {
    return await this.blobToBase64(attachment).then(base64 =>
      this.client.put<unknown, JobResponse, JobRequest>("/jobs", {
        args: `delivery config ${project} ${deliverable} ${stage}`,
        kwargs: {
          content: `${filename}:${attachment_name}:${base64}`,
          dry_run: true,
        },
      })
    )
  }

  private async blobToBase64(blob: Blob) {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    return new Promise(resolve => {
      reader.onloadend = () => {
        const dataUrl = reader.result as string

        resolve(dataUrl.substring(dataUrl.indexOf(",") + 1))
      }
    })
  }

  onRequestError(callback: (error: unknown) => void) {
    this.client.interceptors.response.use(null, callback)
  }
}
