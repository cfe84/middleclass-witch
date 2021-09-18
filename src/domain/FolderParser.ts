import { IDependencies } from "../contract/IDependencies";
import { TodoItem } from "./TodoItem";
import { IContext } from "../contract/IContext";
import { IDictionary } from "./IDictionary";
import { FileParser } from "./FileParser";
import { ParsedFile } from "./ParsedFile";
import { ParsedFolder } from "./ParsedFolder";
import { Attachment } from "./Attachment";
import { FileAttributes } from "./FileProperties";

const ADD_ATTRIBUTES_ATTRIBUTE_NAME = "addAttributes"

interface Attributes {
  attributes: IDictionary<string[]>
  projectAttributes: IDictionary<string[]>
}

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
    todos.forEach(todo => {
      Object.keys(fileProperties.attributes).forEach(attribute => {
        if (todo.attributes[attribute] === undefined) {
          todo.attributes[attribute] = fileProperties.attributes[attribute] as string
        }
      })
    })
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

  private isMarkdownFile(path: string) {
    return path.endsWith(".md")
  }

  private findAttributeAttachments(attributeValue: string, folder: string): Attachment[] {
    const files = this.deps.fs.readdirSync(folder)
    const attachments = files
      .map(file => ({
        path: this.deps.path.join(folder, file),
        name: file
      }))
      .map((attachment) => {
        if (this.deps.fs.lstatSync(attachment.path).isDirectory()) {
          return this.findAttributeAttachments(attributeValue, attachment.path)
        } else if (!this.isMarkdownFile(attachment.name)) {
          return [attachment]
        } else {
          return []
        }
      })
      .reduce((prev, curr) => {
        prev = prev.concat(curr
          .filter(project => project !== undefined))
        return prev
      }, [])
    return attachments
  }

  private findAttachments(folder: string): IDictionary<Attachment[]> {
    const res: IDictionary<Attachment[]> = {}
    const files = this.deps.fs.readdirSync(folder)
    files.forEach((file) => {
      const path = this.deps.path.join(folder, file);
      if (this.deps.fs.lstatSync(path).isDirectory()) {
        const attachments = this.findAttributeAttachments(file, path)
        res[file] = attachments
      }
    })
    return res
  }

  private aggregateTodos(files: ParsedFile[]): TodoItem[] {
    return files
      .map(file => file.todos)
      .reduce((prev, curr) => {
        prev = prev.concat(curr)
        return prev
      }, [])
  }

  private applyAddAttributes(files: ParsedFile[]) {
    for (let file of files) {
      const attributes = file.fileProperties.attributes
      const addAttributes = attributes[ADD_ATTRIBUTES_ATTRIBUTE_NAME] as FileAttributes
      if (!addAttributes || typeof (addAttributes) !== "object") {
        continue
      }
      file.fileProperties.addAttributes = true
      const desiredAttributes = Object.keys(attributes).filter(attribute => attribute !== ADD_ATTRIBUTES_ATTRIBUTE_NAME)
      const fileMatches = (f: ParsedFile) => !desiredAttributes.find(attributeName => {
        const desiredValue = attributes[attributeName]
        return f.fileProperties.attributes[attributeName] !== desiredValue
      })
      files.filter(fileMatches).forEach(file => {
        Object.keys(addAttributes)
          .forEach(attributeName => file.fileProperties.attributes[attributeName] = addAttributes[attributeName])
      })
    }
  }

  public parseFolder(folder: string): ParsedFolder {
    const files = this.findFolderFiles(folder)
    this.applyAddAttributes(files)
    const allAttributes = this.listAttributes(files);
    const attributes: IDictionary<string[]> = allAttributes.attributes
    const projectAttributes: IDictionary<string[]> = allAttributes.projectAttributes
    const attachments = this.findAttachments(folder)
    const todos = this.aggregateTodos(files)
    const parsedFolder: ParsedFolder = {
      todos,
      files,
      attachmentsByAttributeValue: attachments,
      attributes: Object.keys(attributes).sort((a, b) => a.localeCompare(b)),
      attributeValues: attributes,
      projectAttributes: Object.keys(projectAttributes)
    }
    if (!attributes["selected"]) {
      attributes["selected"] = []
    }
    return parsedFolder
  }

  private listAttributes(files: ParsedFile[]): Attributes {
    const attributes: IDictionary<string[]> = {};
    const projectAttributes: IDictionary<string[]> = {};
    const addAttributes = (attributes: IDictionary<string[]>, todoAttributes: IDictionary<any>) => {
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
        addAttributes(attributes, file.fileProperties.attributes)
        addAttributes(projectAttributes, file.fileProperties.attributes)
      }
      file.todos.forEach(todo => {
        if (todo.attributes) {
          addAttributes(attributes, todo.attributes)
        }
      })
    })
    return {
      attributes,
      projectAttributes
    };
  }
}