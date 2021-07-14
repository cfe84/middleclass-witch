import { makeFakeDeps } from "./FakeDeps"
import { fakeContext } from "./FakeContext"
import * as should from "should"
import * as td from "testdouble"
import { TestUtils } from "./TestUtils"
import { IDictionary } from "../src/domain/IDictionary"
import { ParsedFile } from "../src/domain/ParsedFile"

import { FileOperations } from "../src/domain/FileOperations"

const makeFakeFile = (name: string, attributes: IDictionary<string>): ParsedFile => ({
  fileProperties: {
    attributes,
    name,
    path: `path(${name})`
  },
  todos: []
})

describe("File operations", function () {
  context("Archive", function () {
    // given
    const ctx = fakeContext()
    const deps = makeFakeDeps()
    const archive = deps.path.join(ctx.rootFolder, ctx.config.folders.archive)
    td.when(deps.date.thisYearAsYString()).thenReturn("2021")
    const attributeFolder = deps.path.join(archive, "2021", "project - test")


    const f1 = makeFakeFile("f1", { project: "test" })
    const f2 = makeFakeFile("f2", { project: "abc", other: "sdfs" })
    const f3 = makeFakeFile("f3", { other: "234" })
    const f4 = makeFakeFile("f4", { project: "test", other: "2454" })

    td.when(deps.fs.existsSync(attributeFolder)).thenReturn(false, true, true, true)
    ctx.parsedFolder.files = [f1, f2, f3, f4]

    // when
    const ops = new FileOperations(deps, ctx)
    ops.archive("project", "test")

    // then
    it("moves files with right attribute", function () {
      td.verify(deps.fs.mkdirSync(attributeFolder, { recursive: true }))
      td.verify(deps.fs.renameSync(f1.fileProperties.path, deps.path.join(attributeFolder, f1.fileProperties.name)))
      td.verify(deps.fs.renameSync(f4.fileProperties.path, deps.path.join(attributeFolder, f4.fileProperties.name)))
    })
    it("doesn't move other files", function () {
      td.verify(deps.fs.renameSync(f3.fileProperties.path, td.matchers.contains(f3.fileProperties.name)), { times: 0 })
      td.verify(deps.fs.renameSync(f2.fileProperties.path, td.matchers.contains(f2.fileProperties.name)), { times: 0 })
    })
  })
})