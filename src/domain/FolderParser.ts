import { IDependencies } from "../contract/IDependencies";
import { TodoItem } from "./TodoItem";
import { IContext } from "../contract/IContext";
import { IDictionary } from "./IDictionary";
import { FileParser } from "./FileParser";

export interface ParsedFolder {
  todos: TodoItem[]
  attributes: string[]
  attributeValues: IDictionary<string[]>
}

export class FolderParser {
  constructor(private deps: IDependencies, private context: IContext, private fileParser: FileParser = new FileParser(deps)) {
  }

  private parseFile(file: string): TodoItem[] {
    if (!file.endsWith(".md")) {
      return []
    }
    const content = `${this.deps.fs.readFileSync(file)}`
    const todos = this.fileParser.parseFile(content, file)
    return todos
  }

  private findFolderTodos(folder: string): TodoItem[] {
    if (folder === this.context.templatesFolder) {
      return []
    }
    const files = this.deps.fs.readdirSync(folder)
    const todos = files
      .map(file => this.deps.path.join(folder, file))
      .map((file) =>
        this.deps.fs.lstatSync(file).isDirectory() ?
          this.findFolderTodos(file) :
          this.parseFile(file)
      )
      .reduce((prev, curr) => {
        prev = prev.concat(curr)
        return prev
      }, [])
    return todos
  }

  public parseFolder(folder: string): ParsedFolder {
    const todos = this.findFolderTodos(folder)
    const attributes: IDictionary<string[]> = {}
    todos.forEach(todo => {
      if (!todo.attributes) {
        return
      }
      const todoAttributes = todo.attributes
      Object.keys(todoAttributes).forEach(attribute => {
        if (!attributes[attribute]) {
          attributes[attribute] = []
        }
        if (todoAttributes[attribute] !== true && attributes[attribute].indexOf(todoAttributes[attribute] as string) < 0) {
          attributes[attribute].push(todoAttributes[attribute] as string)
        }
      })
    })

    const parsedFolder: ParsedFolder = {
      todos,
      attributes: Object.keys(attributes).sort((a, b) => a.localeCompare(b)),
      attributeValues: attributes
    }
    if (!attributes["project"]) {
      attributes["project"] = []
    }
    if (!attributes["selected"]) {
      attributes["selected"] = []
    }
    todos.forEach(todo => {
      if (todo.project !== undefined && !attributes["project"].find(value => value === todo.project)) {
        attributes["project"].push(todo.project)
      }
    })
    return parsedFolder
  }
}