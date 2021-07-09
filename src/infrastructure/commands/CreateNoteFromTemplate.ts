import * as vscode from 'vscode';
import { ICommand } from './ICommand';
import { IDependencies } from '../../contract/IDependencies';
import { IContext } from '../../contract/IContext';
import { TemplateSelector } from '../../domain/TemplateSelector';
import { TemplateProcessor } from '../../domain/TemplateProcessor';
import { IDictionary } from '../../domain/IDictionary';
import { CreateNoteSubcommand } from './CreateNoteSubcommand';

export class CreateNoteFromTemplate implements ICommand<string | null> {
  private templateSelector: TemplateSelector
  private createNoteSubcommand: CreateNoteSubcommand
  constructor(private deps: IDependencies, private context: IContext) {
    this.templateSelector = new TemplateSelector(deps, context)
    this.createNoteSubcommand = new CreateNoteSubcommand(deps, context)
  }
  get Id(): string { return "mw.createNoteFromTemplate" }

  private async replaceVariables(templateContent: string): Promise<string | null> {
    const templateProcessor = new TemplateProcessor()
    const variables = templateProcessor.getTemplateVariables(templateContent)
    if (variables.length === 0) {
      return templateContent
    }
    const values: IDictionary<string> = {}
    for (let i = 0; i < variables.length; i++) {
      const variableName: string = variables[i]
      const value = await vscode.window.showInputBox({
        placeHolder: `${variableName}`,
        prompt: `Template variable`
      })
      if (value === undefined) {
        return null
      }
      values[variableName] = value
    }
    templateContent = templateProcessor.replaceVariables(templateContent, variables, values)
    return templateContent
  }

  executeAsync = async (): Promise<string | null> => {
    const template = await this.templateSelector.selectTemplateAsync()
    if (!template) {
      return null
    }
    const templateContent =
      template.isEmpty ? "" : `${this.deps.fs.readFileSync(template.path)}`
    const substitutedContent = await this.replaceVariables(templateContent)
    if (substitutedContent === null) {
      return null
    }
    return await this.createNoteSubcommand.executeAsync(substitutedContent)
  }
}