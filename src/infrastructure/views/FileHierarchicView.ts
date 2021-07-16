import * as vscode from 'vscode';
import { IContext } from '../../contract/IContext';
import { IDependencies } from '../../contract/IDependencies';
import { IDictionary } from '../../domain/IDictionary';
import { ParsedFile } from '../../domain/ParsedFile';

enum ProjectItemType {
  Project,
  File
}

export abstract class GroupOrFile extends vscode.TreeItem {
  abstract type: ProjectItemType;

  public asProject(): GroupItem {
    if (this.type === ProjectItemType.Project)
      return this as unknown as GroupItem
    throw (Error("Invalid cast (to project)"))
  }

  public asFile(): FileItem {
    if (this.type === ProjectItemType.File)
      return this as unknown as FileItem
    throw (Error("Invalid cast (to todo item)"))
  }
}

export class GroupItem extends GroupOrFile {
  contextValue = "group"
  type: ProjectItemType = ProjectItemType.Project
  constructor(public attributeName: string, public attributeValue: string, public files: ParsedFile[]) {
    super("📂 " + attributeValue)
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
  }
  filesAsTreeItems = () => this.files.map(file => new FileItem(file))
}

function or(a: any, b: string) {
  if (!a) {
    return b
  }
  return `${a}`
}

export class FileItem extends GroupOrFile {
  contextValue = "file"
  type: ProjectItemType = ProjectItemType.File
  constructor(public file: ParsedFile) {
    super("📝 " + or(file.fileProperties.attributes["title"], file.fileProperties.name))

    const mapAttributeName = (attributeName: string): string =>
      attributeName === "selected" ? "📌"
        : attributeName === "assignee" || attributeName.toLowerCase() === "assignedto" || attributeName === "assigned" || attributeName === "who" ? "🧍‍♂️"
          : attributeName === "due" || attributeName.toLowerCase() === "duedate" || attributeName === "when" ? "📆"
            : "#️⃣ " + attributeName
    const mapAttributeValue = (attributeName: string, attributeValue: string): string =>
      attributeValue
    const flattenAttributes = (attributes: IDictionary<any> | undefined): string =>
      attributes ?
        Object.keys(attributes)
          .map(attributeName => mapAttributeName(attributeName) + (attributes[attributeName] === true ? "" : `: ${mapAttributeValue(attributeName, attributes[attributeName] as string)}`))
          .join(", ")
        : ""
    this.command = {
      title: "Open",
      command: "mw.openFile",
      arguments: [vscode.Uri.file(file.fileProperties.path)]
    }

    this.description = flattenAttributes(file.fileProperties.attributes) + " || " + file.fileProperties.path
    this.collapsibleState = vscode.TreeItemCollapsibleState.None
  }
}

const STORAGEKEY_GROUPBY = "mw.fileView.groupBy"

export class FileHierarchicView implements vscode.TreeDataProvider<GroupOrFile> {
  private groups: GroupItem[] | undefined
  private collapsed: boolean = false
  constructor(private deps: IDependencies, private context: IContext) {
    this._groupBy = context.storage ? context.storage.get(STORAGEKEY_GROUPBY, "project") : "project"
  }

  async toggleCollapsed() {
    this.collapsed = !this.collapsed
    if (this.groups === undefined) {
      return
    }
    this.groups.forEach(group => { })
  }

  private _groupBy: string

  public set groupBy(value: string) {
    this._groupBy = value
    this.context.storage?.update(STORAGEKEY_GROUPBY, value)
    this.refresh()
  }

  private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<GroupOrFile | undefined> = new vscode.EventEmitter<GroupOrFile | undefined>();

  readonly onDidChangeTreeData: vscode.Event<GroupOrFile | undefined> = this.onDidChangeTreeDataEventEmitter.event;

  refresh(): void {
    this.onDidChangeTreeDataEventEmitter.fire(undefined);
  }

  getTreeItem(element: GroupOrFile): GroupOrFile {
    return element.type === ProjectItemType.Project ? element.asProject() : element.asFile()
  }

  private getGroupsByAttribute(attributeName: string): GroupItem[] {
    const res: IDictionary<ParsedFile[]> = {}
    this.context.parsedFolder.files.forEach(
      file => {
        if (!file.fileProperties || !file.fileProperties.attributes) {
          return
        }
        let value = `${file.fileProperties.attributes[attributeName]}`
        if (!file.fileProperties.attributes[attributeName]) {
          value = `(empty ${attributeName})`
        }
        if (value) {
          if (!res[value]) {
            res[value] = []
          }
          res[value].push(file)
        }
      })
    return Object.keys(res)
      .sort()
      .map(attributeValue =>
        new GroupItem(attributeName, attributeValue, res[attributeValue]))
  }

  private getGroupByGroups() {
    return this.getGroupsByAttribute(this._groupBy)
  }

  async getChildren(element?: GroupOrFile | undefined): Promise<GroupOrFile[]> {
    if (element) {
      if (element.type === ProjectItemType.Project) {
        return element.asProject().filesAsTreeItems()
      }
      return []
    }
    this.groups = this.getGroupByGroups()
    return this.groups
  }

}