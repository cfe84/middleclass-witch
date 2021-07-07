export type FileAttributes = { [key: string]: string | string[] | number }

export interface FileProperties {
  project: string | undefined
  attributes: FileAttributes
}