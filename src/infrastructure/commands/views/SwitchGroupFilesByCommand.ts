import * as vscode from 'vscode';
import { ICommand } from '../ICommand';
import { IDependencies } from '../../../contract/IDependencies';
import { IContext } from '../../../contract/IContext';
import {
  FileHierarchicView
} from '../../views/FileHierarchicView';

class GroupByMenuOption {
  constructor(public label: string, public groupByOption: string) { }
}

export class SwitchGroupFilesByCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext, private fileView: FileHierarchicView) {
  }
  get Id(): string { return "mw.filesView.groupFilesBy" }

  executeAsync = async (): Promise<string | null> => {
    const options = this.context.parsedFolder.projectAttributes
      .map((attribute: string) =>
        new GroupByMenuOption(`By ${attribute}`, attribute)
      )
    const option = await vscode.window.showQuickPick(options, { canPickMany: false, placeHolder: "Group by" })
    if (option) {
      this.fileView.groupBy = option.groupByOption
    }
    return ""
  }
}