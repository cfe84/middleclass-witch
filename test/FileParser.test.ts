import * as should from "should"
import { fakeContext } from "./FakeContext"
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
    
    const objectEql = (expected: {[key: string]: any}, actual: {[key: string]: any}): boolean => {
      return !Object.keys(expected).find((key) => 
        {
          if (typeof expected[key] === "object") {
            return actual[key] 
              && typeof actual[key] === "object" 
              && objectEql(expected[key], actual[key])
          }
          return expected[key] !== actual[key]
        })
    }

    const findObj = (array: object[], expected: object) => {
      return array.find(obj => objectEql(expected, obj))
    }

    it("should load normal todo", () => should(findObj(todos, { status: TodoStatus.Todo, text: "A todo todo", file, project: projectName, line: aTodoTodoLn })).not.be.undefined())
    it("should load completed todo", () => should(findObj(todos, { status: TodoStatus.Complete, text: "a completed todo", file: file, project: projectName, attributes: { assignee: "Pete", booleanAttribute: true }, line: aTodoWithProjectLn })).not.be.undefined())
    it("should load delegated todo", () => should(findObj(todos, { status: TodoStatus.Delegated, text: "a delegated todo", file, project: projectName, attributes: { assignee: "Leah", anotherBooleanAttr: true }, line: aDelegatedTodoLn })).not.be.undefined())
    it("should load in progress todo", () => should(findObj(todos, { status: TodoStatus.InProgress, text: "An in progress todo", file, project: projectName, attributes: {}, line: anInProgressTodo })).not.be.undefined())
  })
})