import { IDictionary } from "./IDictionary";
import { ParsedFile } from "./ParsedFile";
import { TodoItem } from "./TodoItem";

export interface ParsedFolder {
  todos: TodoItem[]
  files: ParsedFile[]
  attributes: string[]
  attributeValues: IDictionary<string[]>
}