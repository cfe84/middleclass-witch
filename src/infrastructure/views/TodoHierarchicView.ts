import * as vscode from "vscode";
import { IContext } from "../../contract/IContext";
import { IDependencies } from "../../contract/IDependencies";
import { TodoItem, TodoStatus } from "../../domain/TodoItem";
import { IDictionary } from "../../domain/IDictionary";
import { DateTime } from "luxon";

enum ItemType {
  Group,
  Todo,
}

abstract class GroupOrTodo extends vscode.TreeItem {
  abstract type: ItemType;

  public asGroup(): Group {
    if (this.type === ItemType.Group) return this as unknown as Group;
    throw Error("Invalid cast (to group)");
  }

  public asTodoItem(): TodoTreeItem {
    if (this.type === ItemType.Todo) return this as unknown as TodoTreeItem;
    throw Error("Invalid cast (to todo item)");
  }
}

const statusToIcon = (status: TodoStatus): string => {
  switch (status) {
    case TodoStatus.Complete:
      return "✔";
    case TodoStatus.AttentionRequired:
      return "❗";
    case TodoStatus.Canceled:
      return "❌";
    case TodoStatus.Delegated:
      return "👬";
    case TodoStatus.InProgress:
      return "‍⏩";
    case TodoStatus.Todo:
      return "⬜";
    default:
      return "";
  }
};

class Group extends GroupOrTodo {
  type: ItemType = ItemType.Group;
  constructor(public name: string, public todos: TodoItem[]) {
    super(name);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  }
  todosAsTreeItems = () => this.todos.map((todo) => new TodoTreeItem(todo));
}

const attributeIsPriority = (attributeName: string) =>
  attributeName === "priority" || attributeName === "importance";

const mapPriority = (
  attributes: IDictionary<string | boolean> | undefined
): string =>
  attributes
    ? (Object.keys(attributes)
      .filter(attributeIsPriority)
      .map((priority) => attributes[priority])
      .map((attributeValue) =>
        attributeValue === "critical"
          ? "❗❗"
          : attributeValue === "high"
            ? "❗"
            : attributeValue === "medium"
              ? "🔸"
              : attributeValue === "low"
                ? "🔽"
                : attributeValue === "lowest"
                  ? "⏬"
                  : ""
      )[0] as string) || ""
    : "";

class TodoTreeItem extends GroupOrTodo {
  type: ItemType = ItemType.Todo;
  constructor(private todo: TodoItem) {
    super(
      statusToIcon(todo.status) + mapPriority(todo.attributes) + " " + todo.text
    );

    const mapAttributeName = (attributeName: string): string =>
      attributeName === "selected"
        ? "📌"
        : attributeName === "assignee" ||
          attributeName.toLowerCase() === "assignedto" ||
          attributeName === "assigned" ||
          attributeName === "who"
          ? "🧍‍♂️"
          : attributeName === "due" ||
            attributeName.toLowerCase() === "duedate" ||
            attributeName === "when"
            ? "📆"
            : "#️⃣ " + attributeName;
    const mapAttributeValue = (
      attributeName: string,
      attributeValue: string
    ): string => attributeValue;
    const flattenAttributes = (
      attributes: IDictionary<string | boolean> | undefined
    ): string =>
      attributes
        ? Object.keys(attributes)
          .map(
            (attributeName) =>
              mapAttributeName(attributeName) +
              (attributes[attributeName] === true
                ? ""
                : `: ${mapAttributeValue(
                  attributeName,
                  attributes[attributeName] as string
                )}`)
          )
          .join(", ")
        : "";
    this.command = {
      title: "Open",
      command: "mw.openAtLine",
      arguments: [vscode.Uri.file(todo.file), todo.line],
    };

    this.description =
      (todo.file) + " " + flattenAttributes(todo.attributes);
    this.collapsibleState =
      todo.subtasks && todo.subtasks.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None;
  }

  subtasksAsTreeItems(): TodoTreeItem[] {
    return this.todo.subtasks && this.todo.subtasks.length > 0
      ? this.todo.subtasks.map((task) => new TodoTreeItem(task))
      : [];
  }
}

export enum GroupByOption {
  status,
  nogroups,
  attribute,
}

export interface GroupByConfig {
  groupByOption: GroupByOption;
  attributeName?: string;
}

export enum SortByOption {
  status,
  attribute,
}

export enum SortByDirection {
  up,
  down,
}

export interface SortByConfig {
  sortByOption: SortByOption;
  sortDirection: SortByDirection;
  attributeName?: string;
}

const STORAGEKEY_SHOWSELECTEDONTOP = "mw.todoView.showSelectedOnTop";
const STORAGEKEY_SHOWDUEONTOP = "mw.todoView.showDueOnTop";
const STORAGEKEY_SHOWCOMPLETED = "mw.todoView.showCompleted";
const STORAGEKEY_SHOWCANCELED = "mw.todoView.showCanceled";
const STORAGEKEY_SHOWEMPTY = "mw.todoView.showEmpty";
const STORAGEKEY_GROUPBY = "mw.todoView.groupBy";
const STORAGEKEY_SORTBY = "mw.todoView.sortBy";

export class TodoHierarchicView
  implements vscode.TreeDataProvider<GroupOrTodo>
{
  constructor(private deps: IDependencies, private context: IContext) {
    this._showSelectedOnTop = context.storage
      ? context.storage.get(STORAGEKEY_SHOWSELECTEDONTOP, true)
      : true;
    this._showDueOnTop = context.storage
      ? context.storage.get(STORAGEKEY_SHOWDUEONTOP, true)
      : true;
    this._showCompleted = context.storage
      ? context.storage.get(STORAGEKEY_SHOWCOMPLETED, true)
      : true;
    this._showCanceled = context.storage
      ? context.storage.get(STORAGEKEY_SHOWCANCELED, true)
      : true;
    this._showEmpty = context.storage
      ? context.storage.get(STORAGEKEY_SHOWEMPTY, true)
      : true;
    this._groupBy = context.storage
      ? context.storage.get(STORAGEKEY_GROUPBY, {
        groupByOption: GroupByOption.status,
      })
      : { groupByOption: GroupByOption.status };
    this._sortBy = context.storage
      ? context.storage.get(STORAGEKEY_SORTBY, {
        sortByOption: SortByOption.status,
        sortDirection: SortByDirection.up,
      })
      : {
        sortByOption: SortByOption.status,
        sortDirection: SortByDirection.up,
      };
  }

  private _groupBy: GroupByConfig;
  private _sortBy: SortByConfig;
  private _showSelectedOnTop: boolean;
  private _showDueOnTop: boolean;
  private _showCompleted: boolean;
  private _showCanceled: boolean;
  private _showEmpty: boolean;

  public set groupBy(value: GroupByConfig) {
    this._groupBy = value;
    this.context.storage?.update(STORAGEKEY_GROUPBY, value);
    this.refresh();
  }

  public set sortBy(value: SortByConfig) {
    this._sortBy = value;
    this.context.storage?.update(STORAGEKEY_SORTBY, value);
    this.refresh();
  }

  public get sortBy(): SortByConfig {
    return this._sortBy;
  }

  public set showSelectedOnTop(value: boolean) {
    this._showSelectedOnTop = value;
    this.context.storage?.update(STORAGEKEY_SHOWSELECTEDONTOP, value);
    this.refresh();
  }
  public get showSelectedOnTop(): boolean {
    return this._showSelectedOnTop;
  }
  public set showDueOnTop(value: boolean) {
    this._showDueOnTop = value;
    this.context.storage?.update(STORAGEKEY_SHOWDUEONTOP, value);
    this.refresh();
  }
  public get showDueOnTop(): boolean {
    return this._showDueOnTop;
  }

  public set showCompleted(value: boolean) {
    this._showCompleted = value;
    this.context.storage?.update(STORAGEKEY_SHOWCOMPLETED, value);
    this.refresh();
  }
  public get showCompleted(): boolean {
    return this._showCompleted;
  }
  public set showCanceled(value: boolean) {
    this._showCanceled = value;
    this.context.storage?.update(STORAGEKEY_SHOWCANCELED, value);
    this.refresh();
  }
  public get showCanceled(): boolean {
    return this._showCanceled;
  }
  public set showEmpty(value: boolean) {
    this._showEmpty = value;
    this.context.storage?.update(STORAGEKEY_SHOWEMPTY, value);
    this.refresh();
  }
  public get showEmpty(): boolean {
    return this._showEmpty;
  }

  private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<
    GroupOrTodo | undefined
  > = new vscode.EventEmitter<GroupOrTodo | undefined>();

  readonly onDidChangeTreeData: vscode.Event<GroupOrTodo | undefined> =
    this.onDidChangeTreeDataEventEmitter.event;

  refresh(): void {
    this.onDidChangeTreeDataEventEmitter.fire(undefined);
  }

  getTreeItem(element: GroupOrTodo): GroupOrTodo {
    return element.type === ItemType.Group
      ? element.asGroup()
      : element.asTodoItem();
  }

  private priorityValues: IDictionary<number> = {
    critical: 10,
    high: 9,
    medium: 5,
    low: 3,
    lowest: -1,
  };

  private groomTodos(todos: TodoItem[]): TodoItem[] {
    if (!this.showCompleted) {
      todos = todos.filter((todo) => todo.status !== TodoStatus.Complete);
    }
    if (!this.showCanceled) {
      todos = todos.filter((todo) => todo.status !== TodoStatus.Canceled);
    }
    const directionMultiplier =
      this._sortBy.sortDirection === SortByDirection.up ? 1 : -1;
    switch (this._sortBy.sortByOption) {
      case SortByOption.status:
        todos = todos.sort(
          (a, b) => (a.status - b.status) * directionMultiplier
        );
        break;

      case SortByOption.attribute:
      default:
        if (!this._sortBy.attributeName) break;
        const attributeName = this._sortBy.attributeName;
        const compare = (a: TodoItem, b: TodoItem) => {
          if (attributeIsPriority(attributeName)) {
            const aPriority = a.attributes
              ? this.priorityValues[a.attributes[attributeName] as string] || 0
              : 0;
            const bPriority = b.attributes
              ? this.priorityValues[b.attributes[attributeName] as string] || 0
              : 0;
            return (aPriority - bPriority) * directionMultiplier;
          }
          if (!a.attributes || a.attributes[attributeName] === undefined)
            // a doesn't have attribute, it's smaller
            return directionMultiplier;
          if (!b.attributes || b.attributes[attributeName] === undefined)
            return -directionMultiplier;
          // a is true, or b is false, a is bigger
          if (
            a.attributes[attributeName] === true ||
            b.attributes[attributeName] === false
          )
            return -directionMultiplier;
          if (
            a.attributes[attributeName] === false ||
            b.attributes[attributeName] === true
          )
            return directionMultiplier;
          return (
            (a.attributes[attributeName] as string).localeCompare(
              b.attributes[attributeName] as string
            ) * directionMultiplier
          );
        };
        todos = todos.sort((a, b) => compare(a, b));
    }
    return todos;
  }

  private getAllTodosIncludingSubs(todos: TodoItem[]): TodoItem[] {
    const atThisLevel = todos;
    const atTheNextLevel = todos
      .map((todo) =>
        !!todo.subtasks ? this.getAllTodosIncludingSubs(todo.subtasks) : []
      )
      .reduce((curr, subTasks) => [...curr, ...subTasks]);
    return [...atThisLevel, ...atTheNextLevel];
  }

  private getSelectedGroup(): Group {
    const allTodos = this.getAllTodosIncludingSubs(
      this.context.parsedFolder.todos
    );
    const selectedTodos = allTodos.filter(
      (todo) => todo.attributes && todo.attributes.selected
    );
    return new Group("Selected tasks", this.groomTodos(selectedTodos));
  }
  private getDueGroup(): Group {
    const dueDateAttributes = ["due", "duedate", "when", "expire", "expires"];
    const now = DateTime.now();
    const allTodos = this.getAllTodosIncludingSubs(
      this.context.parsedFolder.todos
    );
    const todosWithDueDate = allTodos.filter(
      (todo) =>
        todo.attributes &&
        dueDateAttributes.find((attribute) => {
          if (
            todo.status === TodoStatus.Complete ||
            todo.status === TodoStatus.Canceled ||
            !todo.attributes ||
            !todo.attributes[attribute]
          )
            return false;
          try {
            const date = DateTime.fromISO(`${todo.attributes[attribute]}`);
            if (date.startOf("day") < now.endOf("day")) {
              this.deps.logger.log(`Now: ${now}, Due: ${date}`);
            }
            return date < now;
          } catch (err) {
            this.deps.logger.error(`Error while parsing date: ${err}`);
            return false;
          }
        })
    );
    return new Group("Due", todosWithDueDate);
  }

  private getGroupsByStatus(): Group[] {
    const getTodosByStatus = (status: TodoStatus): TodoItem[] =>
      this.context.parsedFolder.todos.filter((todo) => todo.status === status);
    return [
      { label: "Attention required", status: TodoStatus.AttentionRequired },
      { label: "Todo", status: TodoStatus.Todo },
      { label: "In progress", status: TodoStatus.InProgress },
      { label: "Delegated", status: TodoStatus.Delegated },
      { label: "Complete", status: TodoStatus.Complete },
      { label: "Cancelled", status: TodoStatus.Canceled },
    ]
      .map(
        ({ label, status }) =>
          new Group(label, this.groomTodos(getTodosByStatus(status)))
      )
      .filter((group) => group.todos.length > 0);
  }

  private getGroupsByAttribute(attributeName: string): Group[] {
    const todoWithoutThisAttribute = this.context.parsedFolder.todos.filter(
      (todo) => !todo.attributes || todo.attributes[attributeName] === undefined
    );
    let groupedByAttributes = this.context.parsedFolder.attributeValues[
      attributeName
    ].map((attributeValue) => {
      const todos = this.context.parsedFolder.todos.filter(
        (todo) =>
          todo.attributes && todo.attributes[attributeName] === attributeValue
      );
      return new Group(attributeValue, this.groomTodos(todos));
    });
    if (todoWithoutThisAttribute.length > 0) {
      groupedByAttributes = groupedByAttributes.concat(
        new Group("Empty", this.groomTodos(todoWithoutThisAttribute))
      );
    }
    return groupedByAttributes;
  }

  private getNoGroups(): Group[] {
    return [
      new Group("All todos", this.groomTodos(this.context.parsedFolder.todos)),
    ];
  }

  private getGroupByGroups() {
    switch (this._groupBy.groupByOption) {
      case GroupByOption.attribute:
        return this.getGroupsByAttribute(this._groupBy.attributeName as string);
      case GroupByOption.status:
        return this.getGroupsByStatus();
      case GroupByOption.nogroups:
      default:
        return this.getNoGroups();
    }
  }

  private filterEmptyGroups(groups: Group[]): Group[] {
    return groups.filter((group) => group.todos.length > 0);
  }

  async getChildren(element?: GroupOrTodo | undefined): Promise<GroupOrTodo[]> {
    if (element) {
      if (element.type === ItemType.Group) {
        return element.asGroup().todosAsTreeItems();
      }
      if (element.type === ItemType.Todo) {
        return element.asTodoItem().subtasksAsTreeItems();
      }
      return [];
    }
    let groups = this.getGroupByGroups();
    if (!this.showEmpty) groups = this.filterEmptyGroups(groups);
    if (this._showDueOnTop) groups = [this.getDueGroup()].concat(groups);
    if (this._showSelectedOnTop)
      groups = [this.getSelectedGroup()].concat(groups);
    return groups;
  }
}
