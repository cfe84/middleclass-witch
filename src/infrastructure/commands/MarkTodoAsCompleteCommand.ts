import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { LineOperations } from '../../domain/LineOperations';
import { SubstituteLine } from './SubstituteLine';

export class MarkTodoAsCompleteCommand implements ICommand<string | null> {
  constructor(private deps: IDependencies, context: IContext) {
  }
  get Id(): string { return "mw.markTodoAsComplete" }

  executeAsync = async (): Promise<string | null> => {
    const lineOperations = new LineOperations(this.deps)
    SubstituteLine.substitute((line) => lineOperations.setCheckmark(line, "x"))
    return ""
  }
}