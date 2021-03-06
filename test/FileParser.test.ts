import { makeFakeDeps } from "./FakeDeps"
import * as should from "should"
import { TestUtils } from "./TestUtils"
import { FileParser } from "../src/domain/FileParser"
import { TodoItem, TodoStatus } from "../src/domain/TodoItem"

describe("FileParser", () => {
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
    const todos = fileParser.findTodos(content, file)

    // then

    const containsTodo = (expected: Partial<TodoItem>) => {
      const found = TestUtils.findObj(todos, expected)
      if (!found) {
        throw (Error(`Expected to find ${JSON.stringify(expected, null, 2)} in ${JSON.stringify(todos, null, 2)}`))
      }
    }

    it("should load normal todo", () => containsTodo({
      status: TodoStatus.Todo,
      text: "A todo todo",
      file,
      line: aTodoTodoLn
    }))
    it("should load a todo with a project", () => containsTodo(
      {
        text: "a todo with",
        attributes: { "project": "this project" },
      }))
    it("should load completed todo", () => containsTodo(
      {
        status: TodoStatus.Complete,
        text: "a completed todo",
        file: file,
        attributes: { assignee: "Pete", booleanAttribute: true },
        line: aCompletedTodoLn
      }))
    it("should load delegated todo", () => containsTodo({
      status: TodoStatus.Delegated,
      text: "a delegated todo", file,
      attributes: { assignee: "Leah", anotherBooleanAttr: true },
      line: aDelegatedTodoLn
    }))
    it("should load in progress todo", () => containsTodo({
      status: TodoStatus.InProgress,
      text: "An in progress todo",
      file,
      attributes: {},
      line: anInProgressTodo
    }))
  })

  context("File properties", () => {
    // given
    const deps = makeFakeDeps()
    const parser = new FileParser(deps)
    const normalFileContent = `---
project: Something
attribute1: Something else
---
My my
`
    const noHeaderFileContent = `This is the content`
    const doubleHeaderFileContent = `---
project: 1234
---
---
something: 123
---
Bla`
    const noProjectFileContent = `---
something: 123
---`
    const unclosedHeaderContent = `---
project: something

idea is to bla`
    const emptyFileContent = ""
    const crlfFileContent = `---\r\nproject: Something\r\nattribute1: Something else\r\n---\r\nMy my`

    // when
    const normalFile = parser.getFileProperties(normalFileContent, "normal")
    const noHeaderFile = parser.getFileProperties(noHeaderFileContent, "")
    const doubleHeaderFile = parser.getFileProperties(doubleHeaderFileContent, "")
    const noProjectFile = parser.getFileProperties(noProjectFileContent, "")
    const unclosedHeader = parser.getFileProperties(unclosedHeaderContent, "")
    const emptyFile = parser.getFileProperties(emptyFileContent, "")
    const crlfFile = parser.getFileProperties(crlfFileContent, "")

    // then
    it("loads regular header", () => {
      should(normalFile.attributes["attribute1"]).eql("Something else")
      should(normalFile.path).eql("normal")
      should(normalFile.name).eql("BASENAME(normal)")
    })
    it("works for no header", () => should(noHeaderFile.attributes).deepEqual({}))
    it("ignores second header", () => should(doubleHeaderFile.attributes["something"]).be.undefined())
    it("handles header with no project", () => {
      should(noProjectFile.attributes["something"]).eql(123)
    })
    it("ignores header if not closed", () => should(unclosedHeader.attributes).deepEqual({}))
    it("ignores empty file", () => should(emptyFile.attributes).deepEqual({}))
    it("parses CRLF files", () => should(crlfFile.attributes.project).be.eql("Something"))
  })
})