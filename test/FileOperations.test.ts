import { makeFakeDeps } from "./FakeDeps"
import { fakeContext } from "./FakeContext"
import * as should from "should"
import * as td from "testdouble"
import { TestUtils } from "./TestUtils"
import { IDictionary } from "../src/domain/IDictionary"
import { ParsedFile } from "../src/domain/ParsedFile"

import { FileMatch, FileOperations, Matching } from "../src/domain/FileOperations"

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

  context("Consolidate attribute", () => {
    // given
    const ctx = fakeContext()
    const deps = makeFakeDeps()
    td.when(deps.date.nowAsYMDString()).thenReturn("NOW")
    const attributeFileName = deps.path.join(ctx.currentFolder, deps.date.nowAsYMDString() + "--project-test.md")

    const f1 = makeFakeFile("f1", { project: "test" })
    td.when(deps.fs.readFileSync(f1.fileProperties.path)).thenReturn(Buffer.from("F1"))
    const f2 = makeFakeFile("f2", { project: "abc", other: "sdfs" })
    const f3 = makeFakeFile("f3", { other: "234" })
    const f4 = makeFakeFile("f4", { project: "test", other: "2454" })
    td.when(deps.fs.readFileSync(f4.fileProperties.path)).thenReturn(Buffer.from("F2"))

    ctx.parsedFolder.files = [f1, f2, f3, f4]

    // when
    const ops = new FileOperations(deps, ctx)
    ops.consolidateAttribute("project", "test")

    // then
    it("creates files with right attribute", function () {
      td.verify(deps.fs.writeFileSync(attributeFileName, `F1\n\n---\n\nF2`))
    })
    it("Deletes source attribute files", function () {
      td.verify(deps.fs.unlinkSync(f1.fileProperties.path))
      td.verify(deps.fs.unlinkSync(f4.fileProperties.path))
    })
    it("doesn't touch other files", function () {
      td.verify(deps.fs.writeFileSync(td.matchers.not(attributeFileName), td.matchers.anything()), { times: 0 })
      td.verify(deps.fs.readFileSync(f3.fileProperties.path), { times: 0 })
      td.verify(deps.fs.unlinkSync(f3.fileProperties.path), { times: 0 })
      td.verify(deps.fs.readFileSync(f2.fileProperties.path), { times: 0 })
      td.verify(deps.fs.unlinkSync(f2.fileProperties.path), { times: 0 })
    })
  })

  const testFileMatch = (finds: FileMatch[], attributeName: string) => (file: ParsedFile) => {
    should(TestUtils.findObj(finds, {
      attributeName: attributeName,
      attributeValue: attributeName === "filename"
        ? file.fileProperties.name
        : file.fileProperties.attributes[attributeName],
      file: file,
      matching: attributeName === "filename" ? Matching.Name : Matching.Attribute
    })).not.be.undefined()
  }

  context.only("search file names", function () {
    // given
    const ctx = fakeContext()
    const deps = makeFakeDeps()

    const file1 = makeFakeFile("bob adminton", { stream: "interviews", step: "phone screen" })
    const file2 = makeFakeFile("Lisa Durham", { stream: "interviews", step: "loop" })
    const file3 = makeFakeFile("Review with Bob", { stream: "super important project" })
    const file4 = makeFakeFile("Little Interview process during calls review", { stream: "interview management" })

    ctx.parsedFolder.files = [file1, file2, file3, file4]

    const ops = new FileOperations(deps, ctx)

    it("finds simple names", () => {
      const finds = ops.searchFiles("bob")

      should(finds).have.length(2)
      const nameShouldMatch = [file1, file3]
      nameShouldMatch.forEach(testFileMatch(finds, "filename"))
    })
    it("finds in attributes as well", function () {
      const finds = ops.searchFiles("interview")
      should(finds).have.length(4)
      testFileMatch(finds, "filename")(file4)
      const filesWithMatchingAttributes = [file1, file2, file4]
      filesWithMatchingAttributes.forEach(testFileMatch(finds, "stream"))
    })
    it("searches terms separated in the title", () => {
      const finds = ops.searchFiles("lidu")
      should(finds).have.length(2)
      const match = [file2, file4]
      match.forEach(testFileMatch(finds, "filename"))
    })
    it("finds partial matches")
  })
})