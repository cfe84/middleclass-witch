import { IDependencies } from "../contract/IDependencies"
import { FileInspector } from "./FileInspector"
import { FileProperties } from "./FileProperties"
import { LineOperations } from "./LineOperations"
import { TodoItem } from "./TodoItem"
import * as yaml from "yaml"

export class FileParser {
  private lineOperations: LineOperations

  constructor(private deps: IDependencies) {
    this.lineOperations = new LineOperations(deps)
  }

  findTodos(content: string, file: string): TodoItem[] {
    const lines = content.split("\n")
    const todos = lines
      .map((line, number) => this.lineOperations.toTodo(line, number))
      .filter(todo => todo !== null) as TodoItem[]
    todos.forEach(todo => {
      todo.file = file
      todo.project = (todo.attributes && todo.attributes.project) ? todo.attributes.project as string : ""
    })
    return todos
  }

  getFileProperties(content: string, file: string): FileProperties {
    const name = this.deps.path.basename(file)
    const res: FileProperties = {
      project: undefined,
      path: file,
      name,
      attributes: {}
    }
    if (content.length < 3 || content.substr(0, 4) !== "---\n") {
      return res
    }
    const headerEnd = content.indexOf("---", 4)
    if (headerEnd < 0) {
      return res
    }
    const header = content.substr(4, headerEnd - 4)
    const parsedHeader = yaml.parse(header)
    if (parsedHeader.project) {
      res.project = `${parsedHeader.project}`
    }
    res.attributes = parsedHeader
    return res
  }
}