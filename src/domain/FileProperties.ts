export type FileAttributes = { [key: string]: string | string[] | number | FileAttributes }

export interface FileProperties {
  path: string
  name: string
  addAttributes?: boolean
  attributes: FileAttributes
}