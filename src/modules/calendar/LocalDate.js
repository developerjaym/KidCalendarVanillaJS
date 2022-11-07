import DayOfWeek from "./DayOfWeek.js";

export class LocalDate {
    #jsDate;
    static #isInternalConstructing = false;
    constructor(jsDate) {
        if(!LocalDate.#isInternalConstructing) {
            throw 'LocalDate constructor is private. Use a static method to get an instance'
        }
        this.#jsDate = jsDate;
    }

    get year() {
        return this.#jsDate.getUTCFullYear();
    }

    get date() {
        return this.#jsDate.getUTCDate();
    }

    get month() {
        return this.#jsDate.getUTCMonth() + 1;
    }

    get day() {
        return this.#jsDate.getUTCDay();
    }

    get dayOfWeek() {
        return DayOfWeek.fromNumber(this.day);
    }

    get weekend() {
        return this.#jsDate.getUTCDay() === 0 || this.#jsDate.getUTCDay() === 6;
    }

    next() {
        const clonedDate = new Date(this.#jsDate);
        clonedDate.setUTCDate(clonedDate.getUTCDate() + 1);
        LocalDate.#isInternalConstructing = true;
        const instance = new LocalDate(clonedDate);
        LocalDate.#isInternalConstructing = false;
        return instance;
    }

    prior() {
        const clonedDate = new Date(this.#jsDate);
        clonedDate.setUTCDate(clonedDate.getUTCDate() - 1);
        LocalDate.#isInternalConstructing = true;
        const instance = new LocalDate(clonedDate);
        LocalDate.#isInternalConstructing = false;
        return instance;
    }

    toISOString() {
        return `${this.#jsDate.getUTCFullYear()}-${LocalDate.#pad(this.#jsDate.getUTCMonth() + 1)}-${LocalDate.#pad(this.#jsDate.getUTCDate())}`;
    }

    toLocaleString() {
        return LocalDateFormatter.format(this);
    }

    isGreaterThan(otherLocalDate) {
        const yearGreater = this.year > otherLocalDate.year;
        const yearEqual = this.year === otherLocalDate.year;
        const monthGreater = this.month > otherLocalDate.month;
        const monthEqual = this.month === otherLocalDate.month;
        const dateGreater = this.date > otherLocalDate.date;
        const dateEqual = this.date === otherLocalDate.date;
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
        const yearEqual = this.year === otherLocalDate.year;
        const monthEqual = this.month === otherLocalDate.month;
        const dateEqual = this.date === otherLocalDate.date;
        return yearEqual && monthEqual && dateEqual;
    }

    asNumber() {
        return this.#jsDate.getTime();
    }

    clone() {
        LocalDate.#isInternalConstructing = true;
        const instance = new LocalDate(new Date(this.toISOString()));
        LocalDate.#isInternalConstructing = false;
        return instance;
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
        LocalDate.#isInternalConstructing = true;
        const instance = LocalDate.fromISOString(`${todayAsDate.getFullYear()}-${LocalDate.#pad(todayAsDate.getMonth() + 1)}-${LocalDate.#pad(todayAsDate.getDate())}`);
        LocalDate.#isInternalConstructing = false;
        return instance;
    }

    static fromISOString(string) {
        LocalDate.#isInternalConstructing = true;
        const instance = new LocalDate(new Date(string));
        LocalDate.#isInternalConstructing = false;
        return instance;
    }
}

export class Holiday {
    static #CHRISTMAS = new Holiday("Christmas", "🎄");
    static #HALLOWEEN = new Holiday("Halloween", "🎃");
    static #THANKSGIVING = new Holiday("Thanksgiving", "🦃");
    static #FOURTH_OF_JULY = new Holiday("US Independence Day", "🇺🇸");
    #name;
    #icon;
    constructor(name, icon) {
      this.#name = name;
      this.#icon = icon;
    }
    get name() {
        return this.#name;
    }
    get icon() {
        return this.#icon;
    }
    static get CHRISTMAS() {
        return Holiday.#CHRISTMAS;
    }
    static get HALLOWEEN() {
        return Holiday.#HALLOWEEN
    }
    static get THANKSGIVING() {
        return Holiday.#THANKSGIVING;
    }
    static get FOURTH_OF_JULY() {
        return Holiday.#FOURTH_OF_JULY;
    }
  }

export class HolidayUtility {
    static findHolidays(localDate) {
      const holidays = [];
      if (localDate.month === 12 && localDate.date === 25) {
        holidays.push(Holiday.CHRISTMAS);
      }
      if (localDate.month === 10 && localDate.date === 31) {
        holidays.push(Holiday.HALLOWEEN);
      }
      if (localDate.month === 7 && localDate.date === 4) {
        holidays.push(Holiday.FOURTH_OF_JULY);
      }
      if(HolidayUtility.#isXDayOfMonth(localDate, 4, DayOfWeek.THURSDAY, 11)) {
        holidays.push(Holiday.THANKSGIVING);
      }
      return holidays;
    }
    static #isXDayOfMonth(localDate, count, dayOfWeek, month) {
        const rightDay = localDate.dayOfWeek === dayOfWeek;
        const rightMonth = localDate.month === month;
        let actualCount = 1;
        let previousDay = localDate.prior();
        while(rightDay && rightMonth && previousDay.month === month) {
            if(previousDay.dayOfWeek === localDate.dayOfWeek) {
                actualCount++;
            }
            previousDay = previousDay.prior();
        }
        const rightCount = actualCount === count;
        return rightDay && rightMonth && rightCount;
    }
  }

class LocalDateFormatter {
    static #enUS = (localDate) => `${localDate.month}/${localDate.date}/${localDate.year}`;
    static #zhCN = (localDate) => `${localDate.year}-${localDate.month}-${localDate.date}`
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