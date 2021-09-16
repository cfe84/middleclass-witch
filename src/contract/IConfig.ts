import { filename } from "./IPath";

export interface IConfig {
  folders: {
    current: filename,
    archive: filename,
    templates: filename
  }
}