import should from "should"
import td from "testdouble"
import { Pomodoro, sleep } from "../src/domain/Pomodoro"

describe("Pomodoro", async function () {
  const test = async function (pause: boolean) {
    //given
    const length = 4
    const multiplier = 100
    const handler = td.object(["onUpdate", "onFinished"])
    const start = Date.now()

    // when
    const pomodoro = new Pomodoro(length, multiplier)
    pomodoro.onUpdated = handler.onUpdate
    pomodoro.onFinished = handler.onFinished
    pomodoro.start()
    if (pause) {
      await sleep((length + 1) * multiplier / 2)
      pomodoro.pause()
      await sleep((length) * multiplier)
      pomodoro.start()
      await sleep((length + 1) * multiplier / 2)
    } else {
      await sleep((length + 1) * multiplier)
    }

    // then
    const finish = Date.now()
    if (pause) {
      should(finish - start).be.approximately((length + 1) * multiplier * 2, multiplier)
    } else {
      should(finish - start).be.approximately((length + 1) * multiplier, multiplier)
    }
    td.verify(handler.onUpdate("00:03"))
    td.verify(handler.onUpdate("00:02"))
    td.verify(handler.onUpdate("00:01"))
    td.verify(handler.onUpdate("00:00"))
    td.verify(handler.onFinished(), { times: 1 })
    td.verify(handler.onUpdate("0-1:0-1"), { times: 0 })
  }
  it("works from start to finish", async () => {
    this.retries(5)
    await test(false)
  })
  it("works with a pause", async () => {
    this.retries(5)
    await test(true)
  })
})