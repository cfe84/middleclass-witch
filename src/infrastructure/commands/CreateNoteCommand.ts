import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { CreateNoteSubcommand } from './CreateNoteSubcommand';

export class CreateNoteCommand implements ICommand<string | null> {
  private createNoteSubcommand: CreateNoteSubcommand
  constructor(private deps: IDependencies, private context: IContext) {
    this.createNoteSubcommand = new CreateNoteSubcommand(deps, context)
  }
  get Id(): string { return "mw.createNote" }

  executeAsync = async (): Promise<string | null> => {
    let defaultTemplate = ""
    const defaultTemplatePath = this.deps.path.join(this.context.templatesFolder, "default.md")
    if (this.deps.fs.existsSync(defaultTemplatePath)) {
      defaultTemplate = this.deps.fs.readFileSync(defaultTemplatePath).toString()
    }
    return await this.createNoteSubcommand.executeAsync(defaultTemplate)
  }
}