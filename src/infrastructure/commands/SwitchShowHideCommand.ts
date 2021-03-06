import * as vscode from 'vscode';
import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { TodoHierarchicView, GroupByOption } from '../views/TodoHierarchicView';

type voidMethod = () => void
class ShowHideMenuOption {
  constructor(public label: string, public onselect: voidMethod) { }
}

export class SwitchShowHideCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext, private todoView: TodoHierarchicView) {
  }
  get Id(): string { return "mw.todoView.showHide" }

  executeAsync = async (): Promise<string | null> => {
    const option = await vscode.window.showQuickPick([
      new ShowHideMenuOption(`${this.todoView.showSelectedOnTop ? "Hide" : "Show"} selected todos on top`, () => this.todoView.showSelectedOnTop = !this.todoView.showSelectedOnTop),
      new ShowHideMenuOption(`${this.todoView.showDueOnTop ? "Hide" : "Show"} due todos on top`, () => this.todoView.showDueOnTop = !this.todoView.showDueOnTop),
      new ShowHideMenuOption(`${this.todoView.showCompleted ? "Hide" : "Show"} completed todos`, () => this.todoView.showCompleted = !this.todoView.showCompleted),
      new ShowHideMenuOption(`${this.todoView.showCanceled ? "Hide" : "Show"} canceled todos`, () => this.todoView.showCanceled = !this.todoView.showCanceled),
      new ShowHideMenuOption(`${this.todoView.showEmpty ? "Hide" : "Show"} groups with no todos`, () => this.todoView.showEmpty = !this.todoView.showEmpty),
    ], { canPickMany: false })
    if (option) {
      option.onselect()
    }
    return ""
  }
}