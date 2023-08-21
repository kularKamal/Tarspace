export enum JobState {
  STARTED,
  FINISHED,
  CANCELLED,
}

export type CliResponse = {
  message?: string
}

export type ErrorResponse = CliResponse & {
  code?: number
}

export type JobResponse = CliResponse & {
  name: string
  state: JobState
  output: string[]
  exception: string
}

export type ValueResponse<T> = {
  value?: T
}
