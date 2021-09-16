import { IDependencies } from "../contract/IDependencies";
import { IConfig } from "../contract/IConfig";
import { path } from "../contract/IPath";
import * as yaml from "yaml"
import { IConfigLoader } from "../contract/IConfigLoader";

interface IConfigFile {
  config: IConfig
}

const defaultProjectsFolder: string = "current"
const defaultArchiveFolder: string = "archived"

export class ConfigFileLoader implements IConfigLoader {
  constructor(private deps: IDependencies, private filePath: path) {

  }

  private addDefaultValues(config: IConfig) {
    if (!config.folders.current) {
      config.folders.current = defaultProjectsFolder
    }
    if (!config.folders.archive) {
      config.folders.archive = defaultArchiveFolder
    }
  }

  loadConfig(): IConfig {
    let config: IConfig = {
      folders: {
        archive: "",
        current: "",
        templates: ""
      }
    }
    if (this.deps.fs.existsSync(this.filePath)) {
      const fileContent = `${this.deps.fs.readFileSync(this.filePath)}`
      const configurationFile: IConfigFile = yaml.parse(fileContent)
      config = configurationFile.config
    }
    this.addDefaultValues(config)
    return config;
  }
}