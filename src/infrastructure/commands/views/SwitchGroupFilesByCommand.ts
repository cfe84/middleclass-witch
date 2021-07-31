import * as vscode from 'vscode';
import { ICommand } from '../ICommand';
import { IDependencies } from '../../../contract/IDependencies';
import { IContext } from '../../../contract/IContext';
import {
  FileHierarchicView
} from '../../views/FileHierarchicView';

class GroupByMenuOption {
  constructor(public label: string, public groupByOption: string, public isDone = false) { }
}

export class SwitchGroupFilesByCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext, private fileView: FileHierarchicView) {
  }
  get Id(): string { return "mw.filesView.groupFilesBy" }

  executeAsync = async (): Promise<string | null> => {
    let res: string[] = []
    do {
      const current = res.join(" > ")
      let options = this.context.parsedFolder.projectAttributes
        .filter(option => res.indexOf(option) < 0)
        .map((attribute: string) =>
          new GroupByMenuOption(`By ${current} > ${attribute}`, attribute)
        )
      if (res.length > 0) {
        options = options.concat([new GroupByMenuOption(`[Done]: ${current}`, "", true)])
      }
      const option: GroupByMenuOption | undefined = await vscode.window.showQuickPick(options, {
        canPickMany: false,
        placeHolder: "Group by"
      })

      if (option && !option.isDone) {
        res.push(option.groupByOption)
      } else {
        break
      }
    } while (true)
    if (res.length > 0) {
      this.fileView.groupBy = res
    }
    return ""
  }
}