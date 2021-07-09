import { IDependencies } from "../contract/IDependencies";
import { IConfig } from "../contract/IConfig";
import { path } from "../contract/IPath";
import * as yaml from "yaml"

interface IConfigFile {
  config: IConfig
}

const defaultProjectsFolder: string = "current"
const defaultArchiveFolder: string = "archived"

export class ConfigFileLoader {
  constructor(private deps: IDependencies) {

  }

  private addDefaultValues(config: IConfig) {
    if (!config.folders.current) {
      config.folders.current = defaultProjectsFolder
    }
    if (!config.folders.archive) {
      config.folders.archive = defaultArchiveFolder
    }
  }

  loadConfig(filePath: path): IConfig {
    let config: IConfig = {
      folders: {
        archive: "",
        current: ""
      }
    }
    if (this.deps.fs.existsSync(filePath)) {
      const fileContent = `${this.deps.fs.readFileSync(filePath)}`
      const configurationFile: IConfigFile = yaml.parse(fileContent)
      config = configurationFile.config
    }
    this.addDefaultValues(config)
    return config;
  }
}