import * as should from "should"
import { fakeContext } from "./FakeContext"
import { makeFakeDeps } from "./FakeDeps"
import * as td from "testdouble"
import { TodoItem, TodoStatus } from "../src/domain/TodoItem"
import { FolderParser } from "../src/domain/FolderParser"
import { IContext } from "../src/contract/IContext"
import { FileParser } from "../src/domain/FileParser"
const ctx: IContext = fakeContext()
describe("FolderTodoParser", () => {
  const makeTodo = (attributes: { [key: string]: string | boolean }): TodoItem => {
    return {
      file: "",
      status: TodoStatus.InProgress,
      text: '',
      attributes,
      project: "Something"
    }
  }
  context("Hierarchy", () => {
    // given
    const rootFolder = "ROOT"
    const deps = makeFakeDeps()
    const FakeFileParser = td.imitate(FileParser)
    const fakeFileParser = new FakeFileParser(deps)

    td.when(deps.fs.lstatSync(rootFolder)).thenReturn({ isDirectory: () => true })
    td.when(deps.fs.readdirSync(rootFolder)).thenReturn(["file.md", "PROJECTS|Something", "file.txt", ".pw"])
    td.when(deps.fs.lstatSync("ROOT|.pw")).thenReturn({ isDirectory: () => true })
    td.when(deps.fs.readdirSync(deps.path.join(rootFolder, ".pw"))).thenReturn(["templates"])
    td.when(deps.fs.lstatSync("ROOT|.pw|templates")).thenReturn({ isDirectory: () => true })
    td.when(deps.fs.readdirSync(deps.path.join(rootFolder, ".pw", "templates"))).thenReturn(["file.md"])
    td.when(deps.fs.lstatSync("ROOT|.pw|templates|file.md")).thenReturn({ isDirectory: () => false })
    td.when(deps.fs.readFileSync("ROOT|.pw|templates|file.md")).thenReturn(Buffer.from(``))
    td.when(deps.fs.lstatSync("ROOT|file.md")).thenReturn({ isDirectory: () => false })
    td.when(deps.fs.readFileSync("ROOT|file.md")).thenReturn(Buffer.from(``))
    const rootFileTodos = [
      makeTodo({ "assignee": "Pete", "project": "this project" }),
      makeTodo({ "anotherBooleanAttr": false })
    ]
    td.when(fakeFileParser.findTodos("", "ROOT|file.md")).thenReturn(rootFileTodos)
    td.when(deps.fs.lstatSync("ROOT|file.txt")).thenReturn({ isDirectory: () => false })
    td.when(deps.fs.readFileSync("ROOT|file.txt")).thenReturn(Buffer.from(``))
    td.when(deps.fs.lstatSync("ROOT|PROJECTS|Something")).thenReturn({ isDirectory: () => true })
    td.when(deps.fs.readdirSync("ROOT|PROJECTS|Something")).thenReturn(["file2.md"])
    td.when(deps.fs.lstatSync("ROOT|PROJECTS|Something|file2.md")).thenReturn({ isDirectory: () => false })
    td.when(deps.fs.readFileSync("ROOT|PROJECTS|Something|file2.md")).thenReturn(Buffer.from(``))
    const file2Todos = [
      makeTodo({ "assignee": "Leah", "booleanAttribute": true })
    ]
    td.when(fakeFileParser.findTodos("", "ROOT|PROJECTS|Something|file2.md")).thenReturn(file2Todos)

    // when
    const parser = new FolderParser(deps, ctx, fakeFileParser)
    const parsedFolder = parser.parseFolder(rootFolder)
    const todos = parsedFolder.todos

    // then
    it("loads todos from md files", () => {
      rootFileTodos.forEach((todo) => should(todos).containEql(todo))
      file2Todos.forEach((todo) => should(todos).containEql(todo))
    })
    it("doesn't load from txt and templates", () => {
      td.verify(fakeFileParser.findTodos("", "ROOT|.pw|templates|file.md"), { times: 0 })
      td.verify(fakeFileParser.findTodos("", "ROOT|file.txt"), { times: 0 })
    })


    it("loads attributes", () => {
      should(parsedFolder.attributes).containEql("assignee")
      should(parsedFolder.attributes).containEql("project")
      should(parsedFolder.attributes).containEql("booleanAttribute")
      should(parsedFolder.attributes).containEql("anotherBooleanAttr")
    })
    it("loads attribute values", () => {
      should(parsedFolder.attributeValues["assignee"]).containEql("Pete")
      should(parsedFolder.attributeValues["assignee"]).containEql("Leah")
      should(parsedFolder.attributeValues["project"]).containEql("this project")
    })
    it("adds projects as attribute values", () => {
      should(parsedFolder.attributeValues["project"]).containEql("Something")
    })
  })
  context("No content", () => {
    // given
    const rootFolder = "ROOT"
    const deps = makeFakeDeps()
    td.when(deps.fs.lstatSync(rootFolder)).thenReturn({ isDirectory: () => true })
    td.when(deps.fs.readdirSync(rootFolder)).thenReturn(["file.md"])
    td.when(deps.fs.lstatSync("ROOT|file.md")).thenReturn({ isDirectory: () => false })
    td.when(deps.fs.readFileSync("ROOT|file.md")).thenReturn(Buffer.from(`This is just
    content`))

    // when
    const parser = new FolderParser(deps, ctx)
    const todos = parser.parseFolder(rootFolder).todos

    // then
    it("should load empty todos", () => should(todos).have.length(0))
  })
})