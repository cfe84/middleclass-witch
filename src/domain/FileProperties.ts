export type FileAttributes = { [key: string]: string | string[] | number }

export interface FileProperties {
  path: string
  name: string
  project: string | undefined
  attributes: FileAttributes
}