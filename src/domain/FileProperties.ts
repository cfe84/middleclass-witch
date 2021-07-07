export type FileAttributes = { [key: string]: string | string[] | number }

export interface FileProperties {
  file: string
  project: string | undefined
  attributes: FileAttributes
}