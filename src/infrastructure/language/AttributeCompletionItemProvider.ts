import * as vscode from "vscode";
import { IDependencies } from "../../contract/IDependencies";
import { IContext } from "../../contract/IContext";
import { Completion } from "../../domain/Completion";

export const AttributeCompletionTriggerCharacters = ["@", "(", ":"]

export class AttributeCompletionItemProvider implements vscode.CompletionItemProvider {
  private completion: Completion
  constructor(private deps: IDependencies, private context: IContext) {
    this.completion = new Completion(deps, context)
  }
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const isInHeader = this.completion.isInHeader(document.getText(), position.line)
    this.deps.logger.log(`Completing in ${isInHeader ? "header" : "todo attribute"}`)
    const recommendations = isInHeader
      ? this.completion.completeHeader(document.lineAt(position.line).text, position.character)
      : this.completion.completeTodo(document.lineAt(position.line).text, position.character)

    return recommendations.map(proposition => ({ label: proposition }))
  }

}