import { IContext } from "../src/contract/IContext";

export function fakeContext(): IContext {
  return {
    rootFolder: "ROOT", parsedFolder: { files: [], todos: [], attributeValues: {}, attributes: [], projectAttributes: [] }, config: {
      folders: {
        inbox: "INBOX",
        archive: "ARCHIVE",
        current: "PROJECTS",
        recurrences: "RECURRENCES",
        reference: "REFERENCE"
      }
    },
    templatesFolder: "ROOT|.pw|templates"
  }
}