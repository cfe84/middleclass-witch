import { IDependencies } from '../contract/IDependencies';
import { IDictionary } from './IDictionary';
import { IContext } from '../contract/IContext';
import { SpecialFolder, IFolder } from '../contract/IFolder';

const defaultCurrentFolder: string = "current"
const defaultArchiveFolder: string = "archive"

export interface SelectFolderProps {
  allowCreateFolder?: boolean
  allowThisFolder?: boolean
}

export class FolderSelector {

  private folders: IDictionary<string>;

  constructor(private props: SelectFolderProps, private deps: IDependencies, private context: IContext) {
    this.folders = {
      "current": context.config?.folders.current || defaultCurrentFolder,
      "archive": context.config?.folders.archive || defaultArchiveFolder
    }
  }

  private selectSubfolderAsync = async (parentFolder: IFolder): Promise<IFolder | null> => {
    const thisFolder = {
      fullpath: parentFolder.path,
      name: `<Select ${parentFolder.name}>`
    }
    let folders = this.props.allowThisFolder ? [thisFolder] : []
    folders = folders.concat(
      this.deps.fs
        .readdirSync(parentFolder.path)
        .map(f => ({
          fullpath: this.deps.path.join(parentFolder.path, f),
          name: f
        }))
        .filter(f => this.deps.fs.lstatSync(f.fullpath).isDirectory()))
    const pickFolderOption = await this.deps.uiSelector.selectSingleOptionAsync(folders.map(f => ({ label: f.name, folder: f })), "Folder");
    if (!pickFolderOption) {
      return null
    }
    const pickFolder = pickFolderOption.folder
    return {
      path: pickFolder.fullpath,
      name: pickFolder.name,
      underSpecialFolder: parentFolder.underSpecialFolder,
      isSpecialFolder: pickFolder === thisFolder && parentFolder.isSpecialFolder
    }
  }

  getSpecialFolder = (specialFolder: SpecialFolder) => this.deps.path.join(this.context.rootFolder, this.folders[specialFolder])

  selectFolderAsync = async (baseFolder?: SpecialFolder): Promise<IFolder | null> => {
    if (!baseFolder) {
      baseFolder = "current" as SpecialFolder
    }
    if (baseFolder) {
      const folder = this.getSpecialFolder(baseFolder)
      switch (baseFolder) {
        case "current":
          return await this.selectSubfolderAsync({ path: folder, name: baseFolder, underSpecialFolder: baseFolder, isSpecialFolder: true }) || null;
        default:
          return { path: folder, name: baseFolder, underSpecialFolder: baseFolder, isSpecialFolder: true }
      }
    } else {
      return null
    }
  }
}