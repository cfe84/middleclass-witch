import * as vscode from 'vscode';
import { ICommand } from '../ICommand';
import { IDependencies } from '../../../contract/IDependencies';
import { IContext } from '../../../contract/IContext';
import { TodoHierarchicView, GroupByOption, GroupByConfig } from '../../views/TodoHierarchicView';

class GroupByMenuOption {
  constructor(public label: string, public groupByOption: GroupByConfig) { }
}

export class SwitchGroupByCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext, private todoView: TodoHierarchicView) {
  }
  get Id(): string { return "mw.todoView.groupBy" }

  executeAsync = async (): Promise<string | null> => {
    const options = [
      new GroupByMenuOption("Disable grouping", { groupByOption: GroupByOption.nogroups }),
      new GroupByMenuOption("By status", { groupByOption: GroupByOption.status }),
    ].concat(this.context.parsedFolder.attributes
      .filter((attributeName: string) => attributeName !== "selected")
      .map(
        (attribute: string) => new GroupByMenuOption(`By ${attribute}`, { groupByOption: GroupByOption.attribute, attributeName: attribute })
      ))
    const option = await vscode.window.showQuickPick(options, { canPickMany: false, placeHolder: "Group by" })
    if (option) {
      this.todoView.groupBy = option.groupByOption
    }
    return ""
  }
}