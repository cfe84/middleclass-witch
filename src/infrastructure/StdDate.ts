import { IDate } from "../contract/IDate";
import { DateTime } from "luxon"

export class StdDate implements IDate {
  thisYearAsYString(): string {
    const date = new Date()
    return date.getFullYear().toString();
  }
  todayAsYMDString(): string {
    const date = DateTime.now()
    return date.toISODate()
  }
  nowAsYMDString(): string {

    const date = DateTime.now()
    return date.toISODate() + "-" + date.toISOTime().substr(0, 5)
  }
}