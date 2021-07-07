import { FileProperties } from "./FileProperties";
import { TodoItem } from "./TodoItem";

export interface ParsedFile {
  todos: TodoItem[]
  fileProperties: FileProperties
}