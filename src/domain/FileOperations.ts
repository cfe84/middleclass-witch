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
    const files = this.findMatchingFiles(attributeName, attributeValue)
    files.forEach(file => {
      const dest = this.deps.path.join(archiveFolder, file.fileProperties.name)
      this.deps.fs.renameSync(file.fileProperties.path, dest)
    })
  }

  private findMatchingFiles(attributeName: string, attributeValue: string) {
    return this.context.parsedFolder.files
      .filter(file => file.fileProperties.attributes
        && file.fileProperties.attributes[attributeName] === attributeValue);
  }

  consolidateAttribute(attributeName: string, attributeValue: string) {
    const files = this.findMatchingFiles(attributeName, attributeValue)
    const content = files
      .map(file => this.deps.fs.readFileSync(file.fileProperties.path))
      .join(`\n\n---\n\n`)
    const outputFile = this.deps.path.join(
      this.context.currentFolder,
      `${this.deps.date.nowAsYMDString()}--${attributeName}-${attributeValue}.md`)
    this.deps.fs.writeFileSync(outputFile, content)
    files.forEach(file => {
      if (file.fileProperties.path !== outputFile) {
        this.deps.fs.unlinkSync(file.fileProperties.path)
      }
    })
  }
}