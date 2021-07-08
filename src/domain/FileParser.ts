import { IDependencies } from "../contract/IDependencies"
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
    })
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