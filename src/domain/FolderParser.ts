import { IDependencies } from "../contract/IDependencies";
import { TodoItem } from "./TodoItem";
import { IContext } from "../contract/IContext";
import { IDictionary } from "./IDictionary";
import { FileParser } from "./FileParser";
import { ParsedFile } from "./ParsedFile";
import { ParsedFolder } from "./ParsedFolder";



export class FolderParser {
  constructor(private deps: IDependencies, private context: IContext, private fileParser: FileParser = new FileParser(deps)) {
  }

  private parseFile(file: string): ParsedFile | undefined {
    if (!file.endsWith(".md")) {
      return undefined
    }
    const content = `${this.deps.fs.readFileSync(file)}`
    const todos = this.fileParser.findTodos(content, file)
    const fileProperties = this.fileParser.getFileProperties(content, file)
    return {
      todos,
      fileProperties
    }
  }

  private findFolderFiles(folder: string): ParsedFile[] {
    if (folder === this.context.templatesFolder) {
      return []
    }
    const files = this.deps.fs.readdirSync(folder)
    const parsedFiles = files
      .map(file => this.deps.path.join(folder, file))
      .map((file) =>
        this.deps.fs.lstatSync(file).isDirectory() ?
          this.findFolderFiles(file) :
          [this.parseFile(file)]
      )
      .reduce((prev, curr) => {
        prev = prev.concat(curr
          .filter(project => project !== undefined))
        return prev
      }, [])
    return parsedFiles as ParsedFile[]
  }

  private aggregateTodos(files: ParsedFile[]): TodoItem[] {
    return files
      .map(file => file.todos)
      .reduce((prev, curr) => {
        prev = prev.concat(curr)
        return prev
      }, [])
  }

  public parseFolder(folder: string): ParsedFolder {
    const files = this.findFolderFiles(folder)
    const attributes: IDictionary<string[]> = this.listAttributes(files);
    const todos = this.aggregateTodos(files)
    const parsedFolder: ParsedFolder = {
      todos,
      files,
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
      if (todo.project !== undefined && todo.project !== "" && !attributes["project"].find(value => value === todo.project)) {
        attributes["project"].push(todo.project)
      }
    })
    return parsedFolder
  }

  private listAttributes(files: ParsedFile[]) {
    const attributes: IDictionary<string[]> = {};
    const addAttributes = (todoAttributes: IDictionary<any>) => {
      Object.keys(todoAttributes).forEach(attribute => {
        if (!attributes[attribute]) {
          attributes[attribute] = [];
        }
        if (todoAttributes[attribute] !== true
          && `${todoAttributes[attribute]}`.length > 0
          && attributes[attribute].indexOf(`${todoAttributes[attribute]}`) < 0) {
          attributes[attribute].push(`${todoAttributes[attribute]}`);
        }
      });
    }
    files.forEach(file => {
      if (file.fileProperties?.attributes) {
        addAttributes(file.fileProperties.attributes)
      }
      file.todos.forEach(todo => {
        if (todo.attributes) {
          addAttributes(todo.attributes)
        }
      })
    })
    return attributes;
  }

  // private listProjects(files: ParsedFile[]): Project[] {
  //   const projects: { [key: string]: string[] } = {}

  //   files
  //     .map(file => file.fileProperties)
  //     .filter(project => project !== undefined)
  //     .forEach(project => {
  //       const name = project.project as string
  //       if (!projects[name]) {
  //         projects[name] = []
  //       }
  //       projects[name].push(project.path)
  //     })
  //   return Object.keys(projects).map(name => ({
  //     name,
  //     files: projects[name]
  //   }))
  // }
}