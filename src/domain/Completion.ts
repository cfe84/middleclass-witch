import { IContext } from "../contract/IContext";
import { deepStrictEqual } from "assert";
import { IDependencies } from "../contract/IDependencies";

export class Completion {
  constructor(private deps: IDependencies, private context: IContext) { }

  private completeAttribute(beginning: string): string[] {
    return this.context.parsedFolder.attributes.filter((attr: string) => attr.startsWith(beginning))
  }

  private completeAttributeValue(attributeName: string, beginning: string): string[] {
    const values = this.context.parsedFolder.attributeValues[attributeName]
    if (!values)
      return []
    return values.filter((value: string) => value.startsWith(beginning))
  }

  private findCurrentWordBeginning(content: string, position: number): string {
    let beginning = position
    while (beginning > 0 && content[beginning] !== "@" && content[beginning] !== "\n") {
      beginning--
    }
    if (beginning <= 1 || content[beginning] !== "@" || content[beginning - 1] !== " ") {
      return ""
    }
    return content.substr(beginning, position - beginning)
  }

  completeTodo(content: string, position: number): string[] {
    const currentWordBeginning = this.findCurrentWordBeginning(content, position)
    if (currentWordBeginning === "") {
      return []
    }
    const valueBeginningIndex = currentWordBeginning.indexOf("(")
    if (valueBeginningIndex >= 0) {
      const attributeName = currentWordBeginning.substr(1, valueBeginningIndex - 1) // ignore @
      const valueBeginning = currentWordBeginning.substr(valueBeginningIndex + 1, currentWordBeginning.length - valueBeginningIndex - 1)
      return this.completeAttributeValue(attributeName, valueBeginning)
    }
    return this.completeAttribute(currentWordBeginning.substr(1, currentWordBeginning.length - 1))
  }

  completeHeader(content: string, position: number): string[] {
    const valueBeginningIndex = content.indexOf(":")
    if (valueBeginningIndex >= 0 && valueBeginningIndex < position) {
      const attributeName = content.substr(0, valueBeginningIndex).trim() // ignore :
      const valueBeginning = content.substr(valueBeginningIndex + 1, position - valueBeginningIndex - 1).trimLeft()
      return this.completeAttributeValue(attributeName, valueBeginning)
    }
    return this.completeAttribute(content.substr(0, position).trim())
  }

  public isInHeader(content: string, lineNumber: number): boolean {
    const eol = content.indexOf("\r") >= 0 ? "\r\n" : "\n"
    const headerStart = content.indexOf(`---`)
    if (headerStart !== 0) {
      return false
    }
    let lineCount = -1
    let index = headerStart + eol.length
    let newIndex = index
    while ((newIndex = content.indexOf(eol, index)) > 0 && content.substr(index + eol.length, 3) !== "---") {
      index = newIndex + eol.length
      lineCount++
    }
    return lineNumber <= lineCount
  }
}