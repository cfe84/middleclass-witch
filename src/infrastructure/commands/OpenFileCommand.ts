import * as vscode from 'vscode';
import { ICommand } from "./ICommand";
import { IDependencies } from "../../contract/IDependencies";
import { IContext } from "../../contract/IContext";

export class OpenFileCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext) {
  }
  executeAsync = async (filepath: string): Promise<string | null> => {
    await vscode.window.showTextDocument(vscode.Uri.parse(filepath))
    const editor = vscode.window.activeTextEditor
    return null
  }
  get Id(): string { return "mw.openFile" };

}