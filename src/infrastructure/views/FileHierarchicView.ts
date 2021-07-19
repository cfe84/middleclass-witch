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
  constructor(public attributeName: string, public attributeValue: string, public files: ParsedFile[], public attachments: Attachment[]) {
    super("📂 " + attributeValue)
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
  }
  filesAsTreeItems = () => this.files.map(file => new FileItem(file))
  attachmentsAsTreeItems = () => this.attachments.map(attachment => new AttachmentItem(attachment))
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

export class FileHierarchicView implements vscode.TreeDataProvider<FileTreeItem> {
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

  private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<FileTreeItem | undefined> = new vscode.EventEmitter<FileTreeItem | undefined>();

  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined> = this.onDidChangeTreeDataEventEmitter.event;

  refresh(): void {
    this.onDidChangeTreeDataEventEmitter.fire(undefined);
  }

  getTreeItem(element: FileTreeItem): FileTreeItem {
    return element.type === FileItemType.Project ? element.asProject() : element.asFile()
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
        new GroupItem(
          attributeName,
          attributeValue,
          res[attributeValue],
          this.context.parsedFolder.attachmentsByAttributeValue[attributeValue] || []))
  }

  private getGroupByGroups() {
    return this.getGroupsByAttribute(this._groupBy)
  }

  async getChildren(element?: FileTreeItem | undefined): Promise<FileTreeItem[]> {
    if (element) {
      if (element.type === FileItemType.Project) {
        const project = element.asProject()
        const files = project.filesAsTreeItems() as FileTreeItem[]
        const attachments = project.attachmentsAsTreeItems() as FileTreeItem[]
        const all = files
          .concat(attachments)
        return all
      }
      return []
    }
    this.groups = this.getGroupByGroups()
    return this.groups
  }

}