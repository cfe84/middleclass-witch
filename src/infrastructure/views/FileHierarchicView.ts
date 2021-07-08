import * as vscode from 'vscode';
import { IContext } from '../../contract/IContext';
import { IDependencies } from '../../contract/IDependencies';
import { TodoItem } from '../../domain/TodoItem';
import { IDictionary } from '../../domain/IDictionary';
import { Project } from '../../domain/Project';
import { ParsedFile } from '../../domain/ParsedFile';

enum ProjectItemType {
  Project,
  File
}

abstract class GroupOrTodo extends vscode.TreeItem {
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

class GroupItem extends GroupOrTodo {
  type: ProjectItemType = ProjectItemType.Project
  constructor(public attributeValue: string, public files: ParsedFile[]) {
    super(attributeValue)
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
  }
  filesAsTreeItems = () => this.files.map(file => new FileItem(file))
}

class FileItem extends GroupOrTodo {
  type: ProjectItemType = ProjectItemType.File
  constructor(private file: ParsedFile) {
    super(file.fileProperties.name)

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

    this.description = (file.fileProperties.name) + " " + flattenAttributes(file.fileProperties.attributes)
    this.collapsibleState = vscode.TreeItemCollapsibleState.None
  }
}

export enum GroupByOption {
  project,
  attribute
}

export interface GroupByConfig {
  groupByOption: GroupByOption
  attributeName?: string
}

export enum SortByOption {
  project,
  attribute
}

export enum SortByDirection {
  up,
  down
}

export interface SortByConfig {
  sortByOption: SortByOption
  sortDirection: SortByDirection
  attributeName?: string
}

const STORAGEKEY_GROUPBY = "mw.projectView.groupBy"
const STORAGEKEY_SORTBY = "mw.todoView.sortBy"

export class FileHierarchicView implements vscode.TreeDataProvider<GroupOrTodo> {

  constructor(private deps: IDependencies, private context: IContext) {
    deps.logger.log(JSON.stringify(context.parsedFolder.files, null, 2))
    this._groupBy = context.storage ? context.storage.get(STORAGEKEY_GROUPBY, { groupByOption: GroupByOption.project }) : { groupByOption: GroupByOption.project }
    this._sortBy = context.storage ? context.storage.get(STORAGEKEY_SORTBY, { sortByOption: SortByOption.project, sortDirection: SortByDirection.up }) : { sortByOption: SortByOption.project, sortDirection: SortByDirection.up }
  }

  private _groupBy: GroupByConfig
  private _sortBy: SortByConfig

  public set groupBy(value: GroupByConfig) {
    this._groupBy = value
    this.context.storage?.update(STORAGEKEY_GROUPBY, value)
    this.refresh()
  }

  public set sortBy(value: SortByConfig) {
    this._sortBy = value
    this.context.storage?.update(STORAGEKEY_SORTBY, value)
    this.refresh()
  }

  public get sortBy(): SortByConfig {
    return this._sortBy
  }

  private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<GroupOrTodo | undefined> = new vscode.EventEmitter<GroupOrTodo | undefined>();

  readonly onDidChangeTreeData: vscode.Event<GroupOrTodo | undefined> = this.onDidChangeTreeDataEventEmitter.event;

  refresh(): void {
    this.onDidChangeTreeDataEventEmitter.fire(undefined);
  }

  getTreeItem(element: GroupOrTodo): GroupOrTodo {
    return element.type === ProjectItemType.Project ? element.asProject() : element.asFile()
  }

  private getGroupsByAttribute(attributeName: string): GroupItem[] {
    const res: IDictionary<ParsedFile[]> = {}
    this.context.parsedFolder.files.forEach(
      file => {
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
    return Object.keys(res).map(attributeValue => new GroupItem(attributeValue, res[attributeValue]))
  }

  private getGroupByGroups() {
    switch (this._groupBy.groupByOption) {
      // case GroupByOption.project:
      //   return this.getGroupsByProject()
      // case GroupByOption.attribute:
      //   return this.getGroupsByAttribute(this._groupBy.attributeName as string)
      default:
        return this.getGroupsByAttribute("project")
    }
  }

  async getChildren(element?: GroupOrTodo | undefined): Promise<GroupOrTodo[]> {
    if (element) {
      if (element.type === ProjectItemType.Project) {
        return element.asProject().filesAsTreeItems()
      }
      return []
    }
    let groups = this.getGroupByGroups()
    return groups
  }

}