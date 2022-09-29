export default class DayOfWeek {
    static SUNDAY = new DayOfWeek("Sunday", "Sun.", true, 0);
    static MONDAY = new DayOfWeek("Monday", "Mon.", false, 1);
    static TUESDAY = new DayOfWeek("Tuesday", "Tues.", false, 2);
    static WEDNESDAY = new DayOfWeek("Wednesday", "Wed.", false, 3);
    static THURSDAY = new DayOfWeek("Thursday", "Thu.", false, 4);
    static FRIDAY = new DayOfWeek("Friday", "Fri.", false, 5);
    static SATURDAY = new DayOfWeek("Saturday", "Sat.", true, 6);
    static #allDays = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    constructor(name, shortName, isWeekend, number) {
      this.name = name;
      this.shortName = shortName;
      this.isWeekend = isWeekend;
      this.number = number;
    }
    static fromNumber(number) {
      return DayOfWeek.#allDays.find((day) => day.number === number);
    }
  }