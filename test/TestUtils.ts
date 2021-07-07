export class TestUtils {

  static objectEql(expected: { [key: string]: any }, actual: { [key: string]: any }): boolean {
    const keys = Object.keys(expected)
    const actualDoesntMatchForKey = (key: string) => {
      if (typeof expected[key] === "object") {
        return actual[key] === undefined
          || typeof actual[key] !== "object"
          || !TestUtils.objectEql(expected[key], actual[key])
      } else {
        return expected[key] !== actual[key]
      }
    }
    return keys.length === 0 || !keys.find(actualDoesntMatchForKey)
  }

  static findObj(array: object[], expected: object) {
    return array.find(obj => TestUtils.objectEql(expected, obj))
  }

}