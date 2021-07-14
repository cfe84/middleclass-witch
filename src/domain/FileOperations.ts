import { IContext } from "../contract/IContext";
import { IDependencies } from "../contract/IDependencies";

export class FileOperations {
  constructor(private deps: IDependencies, private context: IContext) { }

  archive(attributeName: string, attributeValue: string) {
    const folderName = `${attributeName} - ${attributeValue}`
    const archiveFolder = this.deps.path.join(
      this.context.rootFolder,
      this.context.config.folders.archive,
      this.deps.date.thisYearAsYString(),
      folderName
    )
    if (!this.deps.fs.existsSync(archiveFolder)) {
      this.deps.fs.mkdirSync(archiveFolder, { recursive: true })
    }
    const files = this.context.parsedFolder.files
      .filter(file =>
        file.fileProperties.attributes && file.fileProperties.attributes[attributeName] === attributeValue)
    files.forEach(file => {
      const dest = this.deps.path.join(archiveFolder, file.fileProperties.name)
      this.deps.fs.renameSync(file.fileProperties.path, dest)
    })
  }
}