import { IContext } from "../src/contract/IContext";

export function fakeContext(): IContext {
  return {
    rootFolder: "ROOT", parsedFolder: { files: [], todos: [], attributeValues: {}, attributes: [], projectAttributes: [] }, config: {
      folders: {
        archive: "ARCHIVE",
        current: "PROJECTS",
      }
    },
    templatesFolder: "ROOT|.pw|templates"
  }
}