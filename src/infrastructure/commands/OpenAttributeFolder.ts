import { IContext } from "../../contract/IContext";
import { IDependencies } from "../../contract/IDependencies";
import { GroupItem } from "../views/FileHierarchicView";
import { ICommand } from "./ICommand";
import * as os from "os"
import * as childprocess from "child_process"

export class OpenAttributeFolder implements ICommand<null> {
  Id: string = "mw.openAttributeFolder";

  constructor(private deps: IDependencies, private context: IContext) { }

  executeAsync = async (group: GroupItem): Promise<null> => {
    const attributeValue = group.attributeValue
    const folder = this.deps.path.join(this.context.currentFolder, attributeValue)
    if (!this.deps.fs.existsSync(folder)) {
      this.deps.fs.mkdirSync(folder)
    }
    // Mac OS requires to use the "open" command
    const command = os.platform() === "darwin" ? "open " : "explorer "
    childprocess.exec(`${command}"${folder}"`, (error) => {
      if (error) {
        this.deps.logger.error(error.message)
      }
    })
    return null
  }

}