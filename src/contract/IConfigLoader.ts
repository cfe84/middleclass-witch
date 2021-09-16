import { IConfig } from "./IConfig";
import { path } from "./IPath";

export interface IConfigLoader {
  loadConfig(): IConfig
}