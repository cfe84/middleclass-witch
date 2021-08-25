import * as vscode from 'vscode';
import { IContext } from '../../contract/IContext';
import { IDependencies } from '../../contract/IDependencies';
import { Attachment } from '../../domain/Attachment';
import { IDictionary } from '../../domain/IDictionary';
import { ParsedFile } from '../../domain/ParsedFile';

enum FileItemType {
  Project,
  File,
  Attachment
}

export abstract class FileTreeItem extends vscode.TreeItem {
  abstract type: FileItemType;

  public asProject(): GroupItem {
    if (this.type === FileItemType.Project)
      return this as unknown as GroupItem
    throw (Error("Invalid cast (to project)"))
  }

  public asFile(): FileItem {
    if (this.type === FileItemType.File)
      return this as unknown as FileItem
    throw (Error("Invalid cast (to todo item)"))
  }

  public asAttachment(): AttachmentItem {
    if (this.type === FileItemType.Attachment)
      return this as unknown as AttachmentItem
    throw (Error("Invalid cast (to attachment)"))
  }
}

export class AttachmentItem extends FileTreeItem {
  contextValue = "attachment"
  type: FileItemType = FileItemType.Project
  constructor(public attachment: Attachment) {
    super("📄 " + attachment.name)
    this.collapsibleState = vscode.TreeItemCollapsibleState.None
    this.command = {
      title: "Open",
      command: "mw.openExternalDocument",
      arguments: [this]
    }
  }

}

export class GroupItem extends FileTreeItem {
  contextValue = "group"
  type: FileItemType = FileItemType.Project
  constructor(public attributeName: string, public attributeValue: string, public children: FileTreeItem[]) {
    super("📂 " + attributeValue)
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
  }
}

function or(a: any, b: string) {
  if (!a) {
    return b
  }
  return `${a}`
}

export class FileItem extends FileTreeItem {
  contextValue = "file"
  type: FileItemType = FileItemType.File
  constructor(public file: ParsedFile) {
    super("📜 " + or(file.fileProperties.attributes["title"], file.fileProperties.name))

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
const STORAGEKEY_FILTERBY = "mw.fileView.filterBy"

export class FileHierarchicView implements vscode.TreeDataProvider<FileTreeItem> {
  private items: FileTreeItem[] | undefined
  private collapsed: boolean = false
  constructor(private deps: IDependencies, private context: IContext) {
    this._groupBy = context.storage ? context.storage.get(STORAGEKEY_GROUPBY, ["project"]) : ["project"]
    this._filterBy = context.storage ? context.storage.get(STORAGEKEY_FILTERBY, {}) : {}
    this.migrateV11();
  }

  private migrateV11() {
    if (!Array.isArray(this._groupBy)) {
      this._groupBy = ["project"];
    }
  }

  async toggleCollapsed() {
    this.collapsed = !this.collapsed
    if (this.items === undefined) {
      return
    }
    this.items.forEach(group => { })
  }

  private _groupBy: string[]

  public set groupBy(value: string[]) {
    this._groupBy = value
    this.context.storage?.update(STORAGEKEY_GROUPBY, value)
    this.refresh()
  }

  private _filterBy: IDictionary<(string | null)[]>
  public get filterBy() { return this._filterBy }
  public setFilter(attributeName: string, values: (string | null)[]) {
    if (values.length === 0) {
      delete this._filterBy[attributeName]
    } else {
      this._filterBy[attributeName] = values
    }
    this.context.storage?.update(STORAGEKEY_FILTERBY, this._filterBy)
    this.refresh()
  }

  private getFilteredFiles(): ParsedFile[] {
    return this.context.parsedFolder.files
      .filter(file => {
        const fileAttributes = file.fileProperties.attributes
        const nonMatchingAttributes = Object.keys(this._filterBy).filter(filteredAttribute => {
          const filteredValues = this._filterBy[filteredAttribute]
          if (!fileAttributes[filteredAttribute] && filteredValues.indexOf(null) >= 0) {
            return false
          }
          return filteredValues.indexOf(`${fileAttributes[filteredAttribute]}`) < 0
        })
        return nonMatchingAttributes.length === 0
      })
  }

  private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<FileTreeItem | undefined> = new vscode.EventEmitter<FileTreeItem | undefined>();

  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined> = this.onDidChangeTreeDataEventEmitter.event;

  refresh(): void {
    this.onDidChangeTreeDataEventEmitter.fire(undefined);
  }

  getTreeItem(element: FileTreeItem): FileTreeItem {
    return element.type === FileItemType.Project ? element.asProject() : element.asFile()
  }

  private getItemsByAttributeRec(files: ParsedFile[], attributeNames: string[]): FileTreeItem[] {
    const attributeName = attributeNames[0]
    const res: IDictionary<ParsedFile[]> = {}
    const nonMatchingFiles: ParsedFile[] = []
    files.forEach(
      file => {
        if (!file.fileProperties || !file.fileProperties.attributes) {
          return
        }
        let value = `${file.fileProperties.attributes[attributeName]}`
        if (!file.fileProperties.attributes[attributeName]) {
          nonMatchingFiles.push(file)
        } else {
          if (value) {
            if (!res[value]) {
              res[value] = []
            }
            res[value].push(file)
          }
        }
      })
    const nonMatchingFilesAsTreeItems = nonMatchingFiles
      .sort((f1, f2) => f1.fileProperties.name.localeCompare(f2.fileProperties.name))
      .map(file => new FileItem(file))
    return Object.keys(res)
      .sort()
      .map(attributeValue => {
        const filesAsTreeItems = attributeNames.length <= 1
          ? res[attributeValue].map(file => new FileItem(file)) as FileTreeItem[]
          : this.getItemsByAttributeRec(res[attributeValue], attributeNames.slice(1))
        const attachmentsAsTreeItems = (this.context.parsedFolder.attachmentsByAttributeValue[attributeValue] || []).map(attachment => new AttachmentItem(attachment)) as FileTreeItem[]
        const all = filesAsTreeItems.concat(attachmentsAsTreeItems)
        return new GroupItem(
          attributeName,
          attributeValue,
          all) as FileTreeItem
      })
      .concat(nonMatchingFilesAsTreeItems)
  }

  private getGroupsByAttribute(attributeNames: string[]): FileTreeItem[] {
    const files = this.getFilteredFiles()
    return this.getItemsByAttributeRec(files, attributeNames)
  }

  private getGroupByGroups() {
    return this.getGroupsByAttribute(this._groupBy)
  }

  async getChildren(element?: FileTreeItem | undefined): Promise<FileTreeItem[]> {
    if (element) {
      if (element.type === FileItemType.Project) {
        const project = element.asProject()
        return project.children
      }
      return []
    }
    this.items = this.getGroupByGroups()
    return this.items
  }

}