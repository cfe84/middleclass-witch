import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { GroupItem } from '../views/FileHierarchicView';
import { FileOperations } from '../../domain/FileOperations';


export class ConsolidateClickedAttributeCommand implements ICommand<string | null> {
  private operations: FileOperations

  constructor(deps: IDependencies, context: IContext) {
    this.operations = new FileOperations(deps, context)
  }

  get Id(): string { return "mw.consolidateClickedAttribute" }

  executeAsync = async (group: GroupItem): Promise<string | null> => {
    this.operations.consolidateAttribute(group.attributeName, group.attributeValue)

    return ""
  }
}