import * as vscode from 'vscode';
import * as fs from "fs"
import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { FileItem } from '../views/FileHierarchicView';

export class DeleteNoteCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext) {
  }
  get Id(): string { return "mw.deleteNote" }

  executeAsync = async (file: FileItem): Promise<string | null> => {
    this.deps.logger.log(`Deleting ${JSON.stringify(file.file.fileProperties.path)}`)
    fs.unlinkSync(file.file.fileProperties.path)
    return ""
  }
}