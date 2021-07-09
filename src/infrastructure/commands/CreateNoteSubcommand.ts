import * as vscode from 'vscode';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';

export class CreateNoteSubcommand {
  constructor(private deps: IDependencies, private context: IContext) {
  }

  executeAsync = async (templateContent: string): Promise<string | null> => {
    const fileName = `${this.deps.date.nowAsYMDString()}.md`
    const path = this.deps.path.join(this.context.rootFolder,
      this.context.config.folders.current,
      fileName)
    this.deps.fs.writeFileSync(path, templateContent)
    const uri = vscode.Uri.file(path);
    const editor = await vscode.window.showTextDocument(uri);
    return ""
  }
}