export type PomodoroUpdatedDelegate = (display: string) => Promise<void>
export type PomodoroFinishedDelegate = () => Promise<void>

export function sleep(ms: number): Promise<NodeJS.Timeout> {
  return new Promise(resolve => {
    let t: NodeJS.Timeout
    t = setTimeout(() => resolve(t), ms)
  })
}

function formatDateComponent(n: number) {
  let res = Math.floor(Math.max(n, 0)).toString()
  if (n < 10) {
    return `0${res}`
  }
  return res
}

export class Pomodoro {
  private remainingInSeconds: number
  private handle: NodeJS.Timeout | undefined
  public onUpdated: PomodoroUpdatedDelegate | undefined
  public onFinished: PomodoroFinishedDelegate | undefined

  constructor(lengthInSeconds: number, private unitMs = 1000) {
    this.remainingInSeconds = lengthInSeconds
  }

  public start() {
    const targetEndDate = Date.now() + this.remainingInSeconds * this.unitMs
    this.handle = setInterval(() => {
      this.remainingInSeconds = (targetEndDate - Date.now()) / this.unitMs
      if (this.remainingInSeconds < 0) {
        if (this.onFinished) {
          const finished = this.onFinished()
          if (finished) {
            finished.then(() => { })
          }
        }
        this.pause()
        return
      }
      const message = `${formatDateComponent(this.remainingInSeconds / 60)}:${formatDateComponent(this.remainingInSeconds % 60)}`
      if (this.onUpdated) {
        const updated = this.onUpdated(message)
        if (updated) {
          updated.then(() => { })
        }
      }
    }, this.unitMs * 90 / 100)
  }

  public pause() {
    if (this.handle) {
      clearInterval(this.handle)
      this.handle = undefined
    }
  }
}