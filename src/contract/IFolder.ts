export interface IFolder {
  path: string
  name: string
  underSpecialFolder: SpecialFolder
  isSpecialFolder: boolean
}

export type SpecialFolder = "current" | "archive";
