import * as should from "should"
import { makeFakeDeps } from "./FakeDeps"
import * as td from "testdouble"
import { FileParser } from "../src/domain/FileParser"
import { TodoItem, TodoStatus } from "../src/domain/TodoItem"

describe.only("FileParser", () => {
  context("Todos", () => {
    const deps = makeFakeDeps()
    const projectName = ""
    const content = `---
project: ${projectName}
---

[ ] A todo todo
not a todo
[ ] a todo with @project(this project)
[x] a completed todo @assignee(Pete) @booleanAttribute

- [d] a delegated todo @assignee(Leah) @anotherBooleanAttr
    - sdfosdifs
Some text

[-] An in progress todo
`
    const file = "ROOT|file.md"
    const aTodoTodoLn = 4
    const aTodoWithProjectLn = aTodoTodoLn + 2
    const aCompletedTodoLn = aTodoWithProjectLn + 1
    const aDelegatedTodoLn = aCompletedTodoLn + 2
    const anInProgressTodo = aDelegatedTodoLn + 4
    // when
    const fileParser = new FileParser(deps)
    const todos = fileParser.parseFile(content, file)

    // then

    const objectEql = (expected: { [key: string]: any }, actual: { [key: string]: any }): boolean => {
      const keys = Object.keys(expected)
      const actualDoesntMatchForKey = (key: string) => {
        if (typeof expected[key] === "object") {
          return actual[key] === undefined
            || typeof actual[key] !== "object"
            || !objectEql(expected[key], actual[key])
        } else {
          return expected[key] !== actual[key]
        }
      }
      return keys.length === 0 || !keys.find(actualDoesntMatchForKey)
    }

    const findObj = (array: object[], expected: object) => {
      return array.find(obj => objectEql(expected, obj))
    }

    const containsTodo = (expected: Partial<TodoItem>) => {
      const found = findObj(todos, expected)
      if (!found) {
        throw (Error(`Expected to find ${JSON.stringify(expected, null, 2)} in ${JSON.stringify(todos, null, 2)}`))
      }
    }

    it("should load normal todo", () => containsTodo({
      status: TodoStatus.Todo,
      text: "A todo todo",
      file,
      project: projectName,
      line: aTodoTodoLn
    }))
    it("should load a todo with a project", () => containsTodo(
      {
        text: "a todo with",
        project: "this project",
        attributes: { "project": "this project" },
      }))
    it("should load completed todo", () => containsTodo(
      {
        status: TodoStatus.Complete,
        text: "a completed todo",
        file: file,
        project: projectName,
        attributes: { assignee: "Pete", booleanAttribute: true },
        line: aCompletedTodoLn
      }))
    it("should load delegated todo", () => containsTodo({
      status: TodoStatus.Delegated,
      text: "a delegated todo", file,
      project: projectName,
      attributes: { assignee: "Leah", anotherBooleanAttr: true },
      line: aDelegatedTodoLn
    }))
    it("should load in progress todo", () => containsTodo({
      status: TodoStatus.InProgress,
      text: "An in progress todo",
      file,
      project: projectName,
      attributes: {},
      line: anInProgressTodo
    }))
  })
})