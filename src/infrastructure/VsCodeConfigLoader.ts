import * as vscode from 'vscode'
import { IConfig } from "../contract/IConfig";
import { IConfigLoader } from "../contract/IConfigLoader";

export class VsCodeConfigLoader implements IConfigLoader {

  /**
   *
   */
  constructor() {

  }

  loadConfig(): IConfig {
    const config = vscode.workspace.getConfiguration("mw")
    const res: IConfig = {
      folders: {
        archive: config.get<string>("folders.archive") || "archive",
        templates: config.get<string>("folders.templates") || ".templates",
        current: config.get<string>("folders.current") || "current"
      }
    }
    return res
  }

}