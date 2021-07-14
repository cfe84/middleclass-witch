import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { FolderSelector } from '../../domain/FolderSelector';
import * as vscode from "vscode"
import { GroupItem } from '../views/FileHierarchicView';
import { FileOperations } from '../../domain/FileOperations';

interface File {
  fsPath: string,
  external: string,
  path: string,
  scheme: string,
  _sep: number
}

export class ArchiveClickedAttributeCommand implements ICommand<string | null> {
  private operations: FileOperations

  constructor(private deps: IDependencies, private context: IContext) {
    this.operations = new FileOperations(deps, context)
  }

  get Id(): string { return "mw.archiveClickedAttribute" }

  executeAsync = async (group: GroupItem): Promise<string | null> => {
    this.operations.archive(group.attributeName, group.attributeValue)

    return ""
  }
}