import * as vscode from 'vscode';
import { ICommand } from '../ICommand';
import { IDependencies } from '../../../contract/IDependencies';
import { IContext } from '../../../contract/IContext';
import {
  FileHierarchicView
} from '../../views/FileHierarchicView';

class AttributeMenuOption {
  constructor(public label: string, public attributeName: string, public isDone = false) { }
}

class ValueMenuOption {
  constructor(public label: string, public valueOption: string | null, public picked: boolean) { }
}

export class FilterFilesByAttributeCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext, private fileView: FileHierarchicView) {
  }
  get Id(): string { return "mw.filesView.filterBy" }

  private async selectAttributeAsync(): Promise<string | null> {
    const attributes = this.context.parsedFolder.projectAttributes
      .map((attribute: string) =>
        new AttributeMenuOption(`Filter by ${attribute}`, attribute)
      )
    const attributeOption: AttributeMenuOption | undefined = await vscode.window.showQuickPick(attributes, {
      canPickMany: false,
      placeHolder: "Filter by"
    })
    if (!attributeOption) {
      return null
    }
    const attributeName = attributeOption.attributeName
    return attributeName
  }

  private async selectValueAsync(attributeName: string): Promise<(string | null)[] | null> {
    const filters = this.fileView.filterBy[attributeName] || []
    const values = this.context.parsedFolder.attributeValues[attributeName]
      .map(value => new ValueMenuOption(`Show ${attributeName} = ${value}`, value, filters.indexOf(value) >= 0))
      .concat(new ValueMenuOption(`Show ${attributeName} is empty`, null, filters.indexOf(null) >= 0))

    const valueOptions: ValueMenuOption[] | undefined = await vscode.window.showQuickPick(values, {
      canPickMany: true,
      placeHolder: "Filter by"
    })
    if (!valueOptions) {
      return null
    }
    return valueOptions.map(opt => opt.valueOption)
  }

  executeAsync = async (): Promise<string | null> => {
    const attributeName = await this.selectAttributeAsync()
    this.deps.logger.log(`Selected to filter with ${attributeName}`)
    if (!attributeName) {
      return ""
    }

    const values = await this.selectValueAsync(attributeName)
    this.deps.logger.log(`Selected to filter with ${attributeName} = ${values}`)
    if (!values) {
      return ""
    }

    this.fileView.setFilter(attributeName, values)
    return ""
  }
}