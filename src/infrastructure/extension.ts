import * as vscode from 'vscode'
import * as fs from "fs"
import * as path from "path"
import { ConsoleLogger } from './ConsoleLogger'
import { StdDate } from './StdDate'
import { VSUiSelector } from './selectors/VSUiSelector'
import { IDependencies } from '../contract/IDependencies'
import { IContext } from '../contract/IContext'
import { SelectFileCommand } from './commands/SelectFileCommand'
import { ICommand } from './commands/ICommand'
import { AddDateToLineCommand } from './commands/AddDateToLineCommand'
import {
	AttributeCompletionItemProvider,
	AttributeCompletionTriggerCharacters
} from './language/AttributeCompletionItemProvider'
import { ArchiveAttributeCommand } from './commands/ArchiveAttributeCommand'
import { ArchiveClickedAttributeCommand } from './commands/ArchiveClickedAttributeCommand'
import { CreateNoteCommand } from './commands/CreateNoteCommand'
import { CreateNoteFromTemplate } from './commands/CreateNoteFromTemplate'
import { FileHierarchicView } from './views/FileHierarchicView'
import { FolderParser } from '../domain/FolderParser'
import { MarkTodoAsCancelledCommand } from './commands/MarkTodoAsCancelledCommand'
import { MarkTodoAsCompleteCommand } from './commands/MarkTodoAsCompleteCommand'
import { MarkTodoAsDelegatedCommand } from './commands/MarkTodoAsDelegatedCommand'
import { MarkTodoAsAttentionRequiredCommand } from './commands/MarkTodoAsAttentionRequiredCommand'
import { MarkTodoAsInProgressCommand } from './commands/MarkTodoAsInProgressCommand'
import { MarkTodoAsTodoCommand } from './commands/MarkTodoAsTodoCommand'
import { OpenExternalDocument } from './commands/OpenExternalDocumentCommand'
import { OpenFileCommand } from './commands/OpenFileCommand'
import { SwitchGroupByCommand } from './commands/views/SwitchGroupByCommand'
import { SwitchShowHideCommand } from './commands/SwitchShowHideCommand'
import { SwitchSortByCommand } from './commands/SwitchSortCommand'
import { SwitchGroupFilesByCommand } from './commands/views/SwitchGroupFilesByCommand'
import { TodoItemFsEventListener } from './eventListeners.ts/TodoItemFsEventListener'
import { TodoHierarchicView } from './views/TodoHierarchicView'
import { ToggleTodoCommand } from './commands/ToggleTodoCommand'
import { DeleteNoteCommand } from './commands/DeleteNoteCommand'
import { ConsolidateClickedAttributeCommand } from './commands/ConsolidateClickedAttributeCommand'
import { FilePropertiesWorkspaceSymbolsProvider } from './language/FilePropertiesWorkspaceSymbolsProvider'
import { FileToggleCollapseCommand } from './commands/views/FileToggleCollapseCommand'
import { OpenAtLineCommand } from './commands/OpenAtLineCommand'
import { ConvertDateAttributesCommand } from './commands/ConvertDateAttributesCommand'
import { OpenAttributeFolder } from './commands/OpenAttributeFolder'
import { PomodoroStatusBar } from './statusbars/PomodoroStatusBar'
import { StartPomodoroTask } from './commands/StartPomodoroTask'
import { FilterFilesByAttributeCommand } from './commands/views/FilterFilesByAttributeCommand'
import { VsCodeConfigLoader } from './VsCodeConfigLoader'

export function activate(vscontext: vscode.ExtensionContext) {
	const logger = new ConsoleLogger()
	logger.log("Loading")
	const date = new StdDate()
	const uiSelector = new VSUiSelector()
	const deps: IDependencies = {
		logger,
		date,
		fs,
		path,
		uiSelector,
	}
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length > 1) {
		logger.error(`No folder is open, or more than one folder is open`)
		return null
	}
	const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
	const configLoader = new VsCodeConfigLoader()
	const config = configLoader.loadConfig()
	const currentFolder = deps.path.join(rootFolder, config.folders.current)
	const templatesFolder = deps.path.join(rootFolder, config.folders.templates)
	if (!fs.existsSync(templatesFolder)) {
		fs.mkdirSync(templatesFolder, { recursive: true })
		fs.writeFileSync(path.join(templatesFolder, "default.md"), "")
	}

	const context: IContext = {
		rootFolder,
		currentFolder,
		config: config || undefined,
		parsedFolder: { todos: [], attributes: [], attributeValues: {}, files: [], projectAttributes: [], attachmentsByAttributeValue: {} },
		storage: vscontext.globalState,
		templatesFolder
	}

	const pomodoroStatusBar = new PomodoroStatusBar(deps, vscontext)

	const commands: ICommand<string | null>[] = [
		new AddDateToLineCommand(deps, context),
		new ArchiveAttributeCommand(deps, context),
		new ArchiveClickedAttributeCommand(deps, context),
		new ConvertDateAttributesCommand(deps, context),
		new ConsolidateClickedAttributeCommand(deps, context),
		new CreateNoteFromTemplate(deps, context),
		new CreateNoteCommand(deps, context),
		new DeleteNoteCommand(deps, context),
		new MarkTodoAsCancelledCommand(deps, context),
		new MarkTodoAsCompleteCommand(deps, context),
		new MarkTodoAsDelegatedCommand(deps, context),
		new MarkTodoAsAttentionRequiredCommand(deps, context),
		new MarkTodoAsInProgressCommand(deps, context),
		new MarkTodoAsTodoCommand(deps, context),
		new OpenAttributeFolder(deps, context),
		new OpenExternalDocument(deps, context),
		new OpenFileCommand(deps, context),
		new OpenAtLineCommand(deps, context),
		new SelectFileCommand(deps, context),
		new StartPomodoroTask(deps, context, pomodoroStatusBar),
		new ToggleTodoCommand(deps, context),
	]
	commands.forEach(command => {
		let disposable = vscode.commands.registerCommand(command.Id, command.executeAsync);
		vscontext.subscriptions.push(disposable);
	})

	const folderParser = new FolderParser(deps, context)
	const todoItemFsEventListener = new TodoItemFsEventListener(deps, context, folderParser)

	vscontext.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((event) => todoItemFsEventListener.onFileSaved(event)),
		vscode.workspace.onDidRenameFiles((event) => todoItemFsEventListener.onFileRenamed(event)),
		vscode.workspace.onDidCreateFiles(event => todoItemFsEventListener.onFileCreated(event)),
		vscode.workspace.onDidDeleteFiles(event => todoItemFsEventListener.onFileDeleted(event))
	)
	context.parsedFolder = folderParser.parseFolder(context.currentFolder)

	const todosView = new TodoHierarchicView(deps, context)
	const viewCommands = [
		new SwitchGroupByCommand(deps, context, todosView),
		new SwitchShowHideCommand(deps, context, todosView),
		new SwitchSortByCommand(deps, context, todosView),
	]
	viewCommands.forEach(command => {
		let disposable = vscode.commands.registerCommand(command.Id, command.executeAsync);
		vscontext.subscriptions.push(disposable);
	})
	vscode.window.registerTreeDataProvider("mw.todoHierarchy", todosView)

	const filesView = new FileHierarchicView(deps, context)
	const fileCommands = [
		new SwitchGroupFilesByCommand(deps, context, filesView),
		new FileToggleCollapseCommand(deps, context, filesView),
		new FilterFilesByAttributeCommand(deps, context, filesView),
	]
	fileCommands.forEach(command => {
		let disposable = vscode.commands.registerCommand(command.Id, command.executeAsync);
		vscontext.subscriptions.push(disposable);
	})
	const fileTreeView = vscode.window.createTreeView("mw.filesHierarchy", { treeDataProvider: filesView })
	vscontext.subscriptions.push(fileTreeView)

	todoItemFsEventListener.fileDidChange.push(() => {
		todosView.refresh()
		filesView.refresh()
	})

	const attributeCompletion = new AttributeCompletionItemProvider(deps, context)
	vscontext.subscriptions.push(
		vscode.languages.registerCompletionItemProvider("markdown", attributeCompletion, ...AttributeCompletionTriggerCharacters)
	)

	const symbolsProvider = new FilePropertiesWorkspaceSymbolsProvider(deps, context)
	vscontext.subscriptions.push(
		vscode.languages.registerWorkspaceSymbolProvider(symbolsProvider)
	)

	logger.log("Loaded")
}

export function deactivate() { }
