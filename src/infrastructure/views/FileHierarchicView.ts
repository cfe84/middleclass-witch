import * as vscode from 'vscode';
import { IContext } from '../../contract/IContext';
import { IDependencies } from '../../contract/IDependencies';
import { TodoItem } from '../../domain/TodoItem';
import { IDictionary } from '../../domain/IDictionary';
import { Project } from '../../domain/Project';

enum ProjectItemType {
  Project,
  File
}

abstract class GroupOrTodo extends vscode.TreeItem {
  abstract type: ProjectItemType;

  public asProject(): ProjectItem {
    if (this.type === ProjectItemType.Project)
      return this as unknown as ProjectItem
    throw (Error("Invalid cast (to project)"))
  }

  public asFile(): FileItem {
    if (this.type === ProjectItemType.File)
      return this as unknown as FileItem
    throw (Error("Invalid cast (to todo item)"))
  }
}

class ProjectItem extends GroupOrTodo {
  type: ProjectItemType = ProjectItemType.Project
  constructor(public project: Project) {
    super(project.name)
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
  }
  filesAsTreeItems = () => this.project.files.map(file => new FileItem(file))
}

class FileItem extends GroupOrTodo {
  type: ProjectItemType = ProjectItemType.File
  constructor(private file: string) {
    super(file)

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
      arguments: [vscode.Uri.file(file)]
    }

    this.description = file//(file.fileProperties.file) + " " + flattenAttributes(file.fileProperties.attributes)
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

  private groomTodos(todos: TodoItem[]): TodoItem[] {
    const directionMultiplier = this._sortBy.sortDirection === SortByDirection.up ? 1 : -1
    switch (this._sortBy.sortByOption) {
      case SortByOption.project:
        todos = todos.sort((a, b) => (a.project && b.project) ? (a.project.localeCompare(b.project) * directionMultiplier) : directionMultiplier)
        break
      case SortByOption.attribute:
      default:
        if (!this._sortBy.attributeName)
          break
        const attributeName = this._sortBy.attributeName
        const compare = (a: TodoItem, b: TodoItem) => {
          if (!a.attributes || a.attributes[attributeName] === undefined) // a doesn't have attribute, it's smaller
            return directionMultiplier
          if (!b.attributes || b.attributes[attributeName] === undefined)
            return -directionMultiplier
          // a is true, or b is false, a is bigger
          if (a.attributes[attributeName] === true || b.attributes[attributeName] === false)
            return -directionMultiplier
          if (a.attributes[attributeName] === false || b.attributes[attributeName] === true)
            return directionMultiplier
          return (a.attributes[attributeName] as string).localeCompare(b.attributes[attributeName] as string) * directionMultiplier
        }
        todos = todos.sort((a, b) => compare(a, b))

    }
    return todos
  }

  private getGroupsByProject(): ProjectItem[] {
    const projects = this.context.parsedFolder.projects
    return projects
      .sort((a, b) => a.name === "Empty" ? 1 : a.name.localeCompare(b.name))
      .map(project => new ProjectItem(project))
  }

  private getGroupsByAttribute(attributeName: string): ProjectItem[] {
    // const todoWithoutThisAttribute = this.context.parsedFolder.todos.filter(todo => !todo.attributes || todo.attributes[attributeName] === undefined)
    // let groupedByAttributes = this.context.parsedFolder.attributeValues[attributeName].map(
    //   attributeValue => {
    //     const todos = this.context.parsedFolder.todos.filter(todo => todo.attributes && todo.attributes[attributeName] === attributeValue)
    //     return new ProjectItem(attributeValue)
    //   })
    // if (todoWithoutThisAttribute.length > 0) {
    //   groupedByAttributes = groupedByAttributes.concat(new ProjectItem("Empty", this.groomTodos(todoWithoutThisAttribute)))
    // }
    // return groupedByAttributes
    return []
  }

  private getNoGroups(): ProjectItem[] {
    // return [new ProjectItem("All todos", this.groomTodos(this.context.parsedFolder.todos))]
    return []
  }

  private getGroupByGroups() {
    switch (this._groupBy.groupByOption) {
      case GroupByOption.project:
        return this.getGroupsByProject()
      case GroupByOption.attribute:
        return this.getGroupsByAttribute(this._groupBy.attributeName as string)
      default:
        return this.getNoGroups()
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