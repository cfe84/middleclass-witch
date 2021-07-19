import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import * as childprocess from "child_process"
import * as os from "os"
import { AttachmentItem } from '../views/FileHierarchicView';


export class OpenExternalDocument implements ICommand<string | null> {
  constructor(private deps: IDependencies, context: IContext) {
  }
  get Id(): string { return "mw.openExternalDocument" }

  executeAsync = async (file: AttachmentItem): Promise<string | null> => {
    const path = file.attachment.path
    // Mac OS requires to use the "open" command
    const command = os.platform() === "darwin" ? "open " : ""
    childprocess.exec(`${command}"${path}"`, (error) => {
      if (error) {
        this.deps.logger.error(error.message)
      }
    })
    return ""
  }
}