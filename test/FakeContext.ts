import { IContext } from "../src/contract/IContext";

export function fakeContext(): IContext {
  return {
    rootFolder: "ROOT",
    currentFolder: "ROOT|PROJECTS",
    parsedFolder: {
      files: [],
      todos: [],
      attributeValues: {},
      attributes: [],
      attachmentsByAttributeValue: {},
      projectAttributes: []
    }, config: {
      folders: {
        archive: "ARCHIVE",
        current: "PROJECTS",
        templates: "TEMPLATES"
      }
    },
    templatesFolder: "ROOT|.pw|templates"
  }
}