import { IContext } from "../../contract/IContext";
import { IDependencies } from "../../contract/IDependencies";
import { PomodoroStatusBar } from "../statusbars/PomodoroStatusBar";
import { TodoTreeItem } from "../views/TodoHierarchicView";
import { ICommand } from "./ICommand";

export class StartPomodoroTask implements ICommand<string | null> {
  constructor(private deps: IDependencies, private context: IContext, private pomodoroStatusBar: PomodoroStatusBar) {
  }

  executeAsync = async (treeItem: TodoTreeItem): Promise<string | null> => {
    const task = treeItem.todo
    this.pomodoroStatusBar.startPomodoro(task.text)
    return ""
  }
  get Id(): string { return "mw.todoView.startPomodoroTask" };

}