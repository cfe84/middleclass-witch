import * as vscode from 'vscode';
import { IDependencies } from '../../contract/IDependencies';
import { Pomodoro } from '../../domain/Pomodoro';

const CLICK_COMMAND_ID = "mw.pomodoro.click"

enum PomodoroStatus {
  started,
  paused,
  stopped
}

export class PomodoroStatusBar {
  private statusBar: vscode.StatusBarItem
  private pomodoro: Pomodoro = new Pomodoro(1)
  private status: PomodoroStatus = PomodoroStatus.stopped
  private topic: string = "pomodoro"

  constructor(private deps: IDependencies, { subscriptions }: vscode.ExtensionContext) {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
    subscriptions.push(this.statusBar)

    subscriptions.push(vscode.commands.registerCommand(CLICK_COMMAND_ID, this.onclick.bind(this)))
    this.statusBar.command = CLICK_COMMAND_ID

    this.updateStatusText("")
    this.statusBar.show()
    this.initializePomodoro(25)
  }

  private initializePomodoro(lengthInMinutes: number) {
    this.pomodoro.pause()
    this.pomodoro = new Pomodoro(lengthInMinutes * 60)
    this.pomodoro.onUpdated = async display => { this.updateStatusText(display) }
    this.pomodoro.onFinished = async () => {
      this.initializePomodoro(lengthInMinutes)
    }
    this.status = PomodoroStatus.paused
  }

  private onclick() {
    if (this.status === PomodoroStatus.stopped) {
      this.deps.logger.log(`Initialized pomodoro`)
      this.initializePomodoro(25)
    } else if (this.status === PomodoroStatus.paused) {
      this.deps.logger.log(`Started pomodoro`)
      this.status = PomodoroStatus.started
      this.pomodoro.start()
    } else {
      this.deps.logger.log(`Paused pomodoro`)
      this.status = PomodoroStatus.paused
      this.pomodoro.pause()
    }
  }

  public startPomodoro(topic: string) {
    this.topic = topic
    this.initializePomodoro(25)
    this.pomodoro.start()
  }

  private updateStatusText(s: string) {
    this.statusBar.text = `🍅 ${s} - ${this.topic}`
  }
}