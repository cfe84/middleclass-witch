import { IContext } from "../contract/IContext";
import { IDependencies } from "../contract/IDependencies";
import { ParsedFile } from "./ParsedFile";

export enum Matching {
  Name = 1,
  Attribute = 2,
  Todo = 3
}

export interface FileMatch {
  file: ParsedFile,
  line: number,
  matching: Matching,
  attributeName: string,
  attributeValue: string
}

export class FileOperations {
  constructor(private deps: IDependencies, private context: IContext) { }

  private matchString(search: string, inString: string): boolean {
    search = search.toLowerCase()
    inString = inString.toLowerCase()
    let inIndex = 0
    for (let i = 0; i < search.length; i++) {
      while (search[i] !== inString[inIndex]) {
        if (inIndex >= inString.length) {
          return false
        }
        inIndex++
      }
      inIndex++
    }
    return true;
  }

  searchFiles(search: string): FileMatch[] {
    const files = this.context.parsedFolder.files
    const todos = this.context.parsedFolder.todos

    const nameMatches = files
      .filter(file => this.matchString(search, file.fileProperties.name))
      .map(file => ({
        file,
        matching: Matching.Name,
        line: -1,
        attributeName: "filename",
        attributeValue: file.fileProperties.name
      }) as FileMatch)

    const attributeMatches = files
      .map(file => {
        const attributes = Object.keys(file.fileProperties.attributes)
        const matchingAttributes = attributes.filter((att) => this.matchString(search, `${file.fileProperties.attributes[att]}`))
        return matchingAttributes.map(attributeName => ({
          file,
          matching: Matching.Attribute,
          attributeName,
          line: -1,
          attributeValue: file.fileProperties.attributes[attributeName]
        }) as FileMatch)
      })
      .reduce((prev, curr) => {
        return prev.concat(curr)
      }, [] as FileMatch[])

    const todoMatches: FileMatch[] = files
      .map(file => {
        const matchingTodos = file.todos.filter(todo => this.matchString(search, todo.text))
        return matchingTodos.map(todo => ({ file, todo }))
      })
      .reduce((matches, match) => matches.concat(match))
      .map(match => ({
        attributeName: "todo",
        attributeValue: match.todo.text,
        file: match.file,
        line: match.todo.line || -1,
        matching: Matching.Todo
      }))
    return nameMatches.concat(attributeMatches).concat(todoMatches)
  }

  archive(attributeName: string, attributeValue: string) {
    const folderName = `${attributeName} - ${attributeValue}`
    const archiveFolder = this.deps.path.join(
      this.context.rootFolder,
      this.context.config.folders.archive,
      this.deps.date.thisYearAsYString(),
      folderName
    )
    if (!this.deps.fs.existsSync(archiveFolder)) {
      this.deps.fs.mkdirSync(archiveFolder, { recursive: true })
    }
    const files = this.findMatchingFiles(attributeName, attributeValue)
    files.forEach(file => {
      const dest = this.deps.path.join(archiveFolder, file.fileProperties.name)
      this.deps.fs.renameSync(file.fileProperties.path, dest)
    })
  }

  private findMatchingFiles(attributeName: string, attributeValue: string) {
    return this.context.parsedFolder.files
      .filter(file => file.fileProperties.attributes
        && file.fileProperties.attributes[attributeName] === attributeValue);
  }

  consolidateAttribute(attributeName: string, attributeValue: string) {
    const files = this.findMatchingFiles(attributeName, attributeValue)
    const content = files
      .map(file => this.deps.fs.readFileSync(file.fileProperties.path))
      .join(`\n\n---\n\n`)
    const outputFile = this.deps.path.join(
      this.context.currentFolder,
      `${this.deps.date.nowAsYMDString()}--${attributeName}-${attributeValue}.md`)
    this.deps.fs.writeFileSync(outputFile, content)
    files.forEach(file => {
      if (file.fileProperties.path !== outputFile) {
        this.deps.fs.unlinkSync(file.fileProperties.path)
      }
    })
  }
}