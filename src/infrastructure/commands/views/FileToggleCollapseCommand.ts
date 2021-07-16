import * as vscode from 'vscode';
import { ICommand } from '../ICommand';
import { IDependencies } from '../../../contract/IDependencies';
import { IContext } from '../../../contract/IContext';
import {
  FileHierarchicView
} from '../../views/FileHierarchicView';

export class FileToggleCollapseCommand implements ICommand<string | null> {
  private collapsed = false
  constructor(private deps: IDependencies, private context: IContext, private fileView: FileHierarchicView) {
  }
  get Id(): string { return "mw.filesView.toggleCollapse" }

  executeAsync = async (): Promise<string | null> => {
    await this.fileView.toggleCollapsed(this.collapsed)
    return ""
  }
}