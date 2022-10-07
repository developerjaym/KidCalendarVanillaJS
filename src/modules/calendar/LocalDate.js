import DayOfWeek from "./DayOfWeek.js";

export class LocalDate {
    #jsDate;
    constructor(jsDate) {
        this.#jsDate = jsDate;
    }

    getYear() {
        return this.#jsDate.getUTCFullYear();
    }

    getDate() {
        return this.#jsDate.getUTCDate();
    }

    getMonth() {
        return this.#jsDate.getUTCMonth() + 1;
    }

    getDay() {
        return this.#jsDate.getUTCDay();
    }

    getDayOfWeek() {
        return DayOfWeek.fromNumber(this.getDay());
    }

    isWeekend() {
        return this.#jsDate.getUTCDay() === 0 || this.#jsDate.getUTCDay() === 6;
    }

    next() {
        const clonedDate = new Date(this.#jsDate);
        clonedDate.setUTCDate(clonedDate.getUTCDate() + 1);
        return new LocalDate(clonedDate);
    }

    prior() {
        const clonedDate = new Date(this.#jsDate);
        clonedDate.setUTCDate(clonedDate.getUTCDate() - 1);
        return new LocalDate(clonedDate);
    }

    toISOString() {
        return `${this.#jsDate.getUTCFullYear()}-${LocalDate.#pad(this.#jsDate.getUTCMonth() + 1)}-${LocalDate.#pad(this.#jsDate.getUTCDate())}`;
    }

    toLocaleString() {
        return LocalDateFormatter.format(this);
    }

    isGreaterThan(otherLocalDate) {
        const yearGreater = this.getYear() > otherLocalDate.getYear();
        const yearEqual = this.getYear() === otherLocalDate.getYear();
        const monthGreater = this.getMonth() > otherLocalDate.getMonth();
        const monthEqual = this.getMonth() === otherLocalDate.getMonth();
        const dateGreater = this.getDate() > otherLocalDate.getDate();
        const dateEqual = this.getDate() === otherLocalDate.getDate();
        if(yearGreater) {
            return true;
        }
        else if(yearEqual && monthGreater) {
            return true;
        }
        else if(yearEqual && monthEqual && dateGreater) {
            return true;
        }
        return false;
    }

    isEqual(otherLocalDate) {
        const yearEqual = this.getYear() === otherLocalDate.getYear();
        const monthEqual = this.getMonth() === otherLocalDate.getMonth();
        const dateEqual = this.getDate() === otherLocalDate.getDate();
        return yearEqual && monthEqual && dateEqual;
    }

    asNumber() {
        return this.#jsDate.getTime();
    }

    clone() {
        return new LocalDate(new Date(this.toISOString()));
    }

    isValid() {
        return this.#jsDate != 'Invalid Date';
    }

    static #pad(number) {
        const numberString = String(number);
        if(numberString.length < 2) {
            return `0${number}`;
        }
        return numberString;
    }

    static today() {
        const todayAsDate = new Date();
        // Take today, get the user's year-month-date to initialize a LocalDate of today
        // If I did new LocalDate(new Date()), then the LocalDate would be whatever 'today' is in England
        return LocalDate.fromISOString(`${todayAsDate.getFullYear()}-${LocalDate.#pad(todayAsDate.getMonth() + 1)}-${LocalDate.#pad(todayAsDate.getDate())}`);
    }

    static fromISOString(string) {
        return new LocalDate(new Date(string));
    }
}

export class Holiday {
    static CHRISTMAS = new Holiday("Christmas", "🎄");
    static HALLOWEEN = new Holiday("Halloween", "🎃");
    static THANKSGIVING = new Holiday("Thanksgiving", "🦃");
    static FOURTH_OF_JULY = new Holiday("US Independence Day", "🇺🇸");
    constructor(name, icon) {
      this.name = name;
      this.icon = icon;
    }
  }

export class HolidayUtility {
    static getHolidays(localDate) {
      const holidays = [];
      if (localDate.getMonth() === 12 && localDate.getDate() === 25) {
        holidays.push(Holiday.CHRISTMAS);
      }
      if (localDate.getMonth() === 10 && localDate.getDate() === 31) {
        holidays.push(Holiday.HALLOWEEN);
      }
      if (localDate.getMonth() === 7 && localDate.getDate() === 4) {
        holidays.push(Holiday.FOURTH_OF_JULY);
      }
      if(HolidayUtility.#isXDayOfMonth(localDate, 4, DayOfWeek.THURSDAY, 11)) {
        holidays.push(Holiday.THANKSGIVING);
      }
      return holidays;
    }
    static #isXDayOfMonth(localDate, count, dayOfWeek, month) {
        const rightDay = localDate.getDayOfWeek() === dayOfWeek;
        const rightMonth = localDate.getMonth() === month;
        let actualCount = 1;
        let previousDay = localDate.prior();
        while(rightDay && rightMonth && previousDay.getMonth() === month) {
            if(previousDay.getDayOfWeek() === localDate.getDayOfWeek()) {
                actualCount++;
            }
            previousDay = previousDay.prior();
        }
        const rightCount = actualCount === count;
        return rightDay && rightMonth && rightCount;
    }
  }

class LocalDateFormatter {
    static #enUS = (localDate) => `${localDate.getMonth()}/${localDate.getDate()}/${localDate.getYear()}`;
    static #zhCN = (localDate) => `${localDate.getYear()}-${localDate.getMonth()}-${localDate.getDate()}`
    static format(localDate) {
        if(navigator.language === 'en-US') {
            return this.#enUS(localDate);
        }
        else if(navigator.language === 'zh-CN') {
            return this.#zhCN(localDate);
        }
        else {
            return this.#enUS(localDate);
        }
    }
}