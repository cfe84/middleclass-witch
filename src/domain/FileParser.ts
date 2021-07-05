import { IDependencies } from "../contract/IDependencies"
import { FileInspector } from "./FileInspector"
import { LineOperations } from "./LineOperations"
import { TodoItem } from "./TodoItem"

export class FileParser {
  private lineOperations: LineOperations

  constructor(private deps: IDependencies) {
    this.lineOperations = new LineOperations(deps)
  }
  
  parseFile(content: string, file: string): TodoItem[] {
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
}