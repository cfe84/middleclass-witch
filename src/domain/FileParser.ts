import { IDependencies } from "../contract/IDependencies"
import { FileProperties } from "./FileProperties"
import { LineOperations } from "./LineOperations"
import { TodoItem } from "./TodoItem"
import * as yaml from "yaml"

export interface ITodoParsingResult {
  isTodo: boolean;
  todo?: TodoItem;
  isBlank?: boolean;
  indentLevel: number;
}

export class FileParser {
  private lineOperations: LineOperations

  constructor(private deps: IDependencies) {
    this.lineOperations = new LineOperations(deps)
  }


  private createTodoTreeStructure(lines: string[], parsingResults: ITodoParsingResult[]) {
    let parentStack: ITodoParsingResult[] = []
    const getParent = () => parentStack[parentStack.length - 1]
    let lastVisitedTodo: ITodoParsingResult | undefined
    parsingResults.forEach((current, i) => {
      if (!lastVisitedTodo) {
        if (current.isTodo) {
          lastVisitedTodo = current
        }
        return
      }

      if (lines[i].match(/^\s*$/)) {
        return
      }

      const isDeeperThanLastTodo = ((current.indentLevel as number) > (lastVisitedTodo.indentLevel as number))
      if (isDeeperThanLastTodo) {
        if (current.isTodo) {
          parentStack.push(lastVisitedTodo);
          (lastVisitedTodo.todo as TodoItem).subtasks = [current.todo as TodoItem]
        }
      } else {
        const isDeeperThanParent = () => ((current.indentLevel as number) > (getParent().indentLevel as number))
        while (getParent() && !isDeeperThanParent()) {
          parentStack.pop()
        }
        if (getParent() && current.isTodo) {
          (getParent().todo as TodoItem).subtasks?.push(current.todo as TodoItem)
        }
      }
      if (current.isTodo) {
        lastVisitedTodo = current
      }
    })
  }

  private removeSubtasksFromTree(todos: TodoItem[]) {
    const toRemove = []
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i]
      if (todo.subtasks) {
        toRemove.push(...todo.subtasks)
      }
    }
    toRemove.forEach(subtask => {
      const idx = todos.findIndex(t => t === subtask)
      todos.splice(idx, 1)
    })
  }


  findTodos(content: string, file: string): TodoItem[] {
    const lines = content.split("\n")
    const parsingResults = lines.map((line, number) => this.lineOperations.toTodo(line, number))
    this.createTodoTreeStructure(lines, parsingResults)
    const todos = parsingResults
      .filter(todoParsingResult => todoParsingResult.isTodo)
      .map(result => result.todo) as TodoItem[]
    todos.forEach((todo) => {
      todo.file = file
    })
    this.removeSubtasksFromTree(todos)
    return todos
  }

  getFileProperties(content: string, file: string): FileProperties {
    const name = this.deps.path.basename(file)
    const eol = content.indexOf("\r") < 0 ? "\n" : "\r\n"
    const marker = `---${eol}`
    const res: FileProperties = {
      path: file,
      name,
      attributes: {}
    }
    if (content.length < 3 || (content.substr(0, marker.length) !== marker)) {
      return res
    }
    const headerEnd = content.indexOf("---", marker.length)
    if (headerEnd < 0) {
      return res
    }
    const header = content.substr(marker.length, headerEnd - marker.length)
    const parsedHeader = yaml.parse(header)
    res.attributes = parsedHeader
    return res
  }
}