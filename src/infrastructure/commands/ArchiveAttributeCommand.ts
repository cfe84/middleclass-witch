import * as vscode from 'vscode';
import { ICommand } from "./ICommand";
import { IDependencies } from "../../contract/IDependencies";
import { IContext } from "../../contract/IContext";
import { FolderSelector } from "../../domain/FolderSelector";
import { FileSelector } from '../../domain/FileSelector';

export class ArchiveAttributeCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext) {
  }
  executeAsync = async (): Promise<string | null> => {
    const folderSelector = new FolderSelector({ allowThisFolder: true }, this.deps, this.context);
    let currentFolder = await folderSelector.selectFolderAsync("current")
    if (!currentFolder) {
      return null
    }
    let objectToArchive: string | null = currentFolder.path
    if (currentFolder.isSpecialFolder) {
      const fileSelector = new FileSelector(this.deps)
      objectToArchive = await fileSelector.selectFileAsync(currentFolder.path)
    }
    if (!objectToArchive) {
      return null
    }
    const archiveFolder = folderSelector.getSpecialFolder("archive")
    const yearlyFolder = this.deps.path.join(archiveFolder, this.deps.date.thisYearAsYString())
    const projectFolderName = this.deps.path.basename(objectToArchive)
    const destination = this.deps.path.join(yearlyFolder, projectFolderName)
    if (!this.deps.fs.existsSync(yearlyFolder)) {
      this.deps.fs.mkdirSync(yearlyFolder)
    }
    vscode.window.showInformationMessage(`Archived project ${projectFolderName}`)
    this.deps.fs.renameSync(objectToArchive, destination)
    return projectFolderName
  }
  get Id(): string { return "mw.consolidateAttribute" };

}