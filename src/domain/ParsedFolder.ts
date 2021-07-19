import { Attachment } from "./Attachment";
import { IDictionary } from "./IDictionary";
import { ParsedFile } from "./ParsedFile";
import { TodoItem } from "./TodoItem";

export interface ParsedFolder {
  todos: TodoItem[]
  files: ParsedFile[]
  projectAttributes: string[]
  attributes: string[]
  attributeValues: IDictionary<string[]>
  attachmentsByAttributeValue: IDictionary<Attachment[]>
}