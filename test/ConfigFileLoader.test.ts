import { makeFakeDeps } from "./FakeDeps"
import * as td from "testdouble"
import * as should from "should"
import { ConfigFileLoader } from "../src/domain/ConfigFileLoader"
import { IConfig } from "../src/contract/IConfig"

describe("ConfigFileLoader", () => {

  context("when config file doesn't exist", () => {

    // given
    const deps = makeFakeDeps()
    const filename = "CONFIG_FILE.yml"
    td.when(deps.fs.existsSync(filename)).thenReturn(false)

    // when
    const configFileLoader = new ConfigFileLoader(deps)
    const res = configFileLoader.loadConfig(filename)

    // then 
    it("doesn't brake", () => {
      should(res).not.be.null();
      should(res.folders.current).eql("current")
    })
  })

  context("config file contains folders", () => {
    // given
    const deps = makeFakeDeps()
    const filename = "CONFIG_FILE.yml"
    const configFile = `config:
  folders:
    current: PROJECTS__
    archive: "The ARCHIVE"
`
    td.when(deps.fs.existsSync(filename)).thenReturn(true)
    td.when(deps.fs.readFileSync(filename)).thenReturn(Buffer.from(configFile))

    // when
    const configLoader = new ConfigFileLoader(deps)
    const config = configLoader.loadConfig(filename) as IConfig

    // then
    it("Loads folders without quotes", () => { should(config.folders.current).eql("PROJECTS__") })
    it("Loads folders with quotes and spaces", () => { should(config.folders.archive).eql("The ARCHIVE") })
  })
})