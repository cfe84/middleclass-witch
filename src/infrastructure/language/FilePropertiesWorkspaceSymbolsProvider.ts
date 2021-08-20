import { CancellationToken, Location, ProviderResult, SymbolInformation, SymbolKind, WorkspaceSymbolProvider } from "vscode";
import { IContext } from "../../contract/IContext";
import { IDependencies } from "../../contract/IDependencies";
import { FileMatch, FileOperations, Matching } from "../../domain/FileOperations";
import * as vscode from 'vscode'

export class FilePropertiesWorkspaceSymbolsProvider implements WorkspaceSymbolProvider {
  private ops: FileOperations
  constructor(deps: IDependencies, context: IContext) {
    this.ops = new FileOperations(deps, context)
  }
  provideWorkspaceSymbols(query: string, token: CancellationToken): ProviderResult<SymbolInformation[]> {
    const matches = this.ops.searchFiles(query)
    const mapMatchToSymbol = (match: FileMatch): SymbolInformation => ({
      containerName: match.file.fileProperties.name,
      kind: match.matching === Matching.Name ? SymbolKind.File
        : match.matching === Matching.Todo ? SymbolKind.Interface
          : match.attributeName === "stream" || match.attributeName === "project" ? SymbolKind.Namespace
            : match.attributeName === "title" ? SymbolKind.Class
              : SymbolKind.Property,
      location: new Location(vscode.Uri.file(match.file.fileProperties.path),
        new vscode.Position(match.line >= 0 ? match.line : 1, 0)),
      name: `${match.attributeName}: ${match.attributeValue}`,
    })
    return matches.map(mapMatchToSymbol)
  }
}