import { filename } from "./IPath";

export interface IConfig {
  folders: {
    current?: filename,
    inbox?: filename,
    recurrences?: filename,
    reference?: filename,
    archive?: filename
  }
}