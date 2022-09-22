class Holiday {
  static CHRISTMAS = new Holiday("Christmas", "🎄");
  static HALLOWEEN = new Holiday("Halloween", "🎃");
  constructor(name, icon) {
    this.name = name;
    this.icon = icon;
  }
}

class DateUtility {
  static dateToDateString(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  static dateStringToDate(dateString) {
    return new Date(dateString.replaceAll('-', '/'));
  }
  static inputDateStringToDateString(javascriptDateString) {
    return javascriptDateString.replaceAll("-0", "-");
  }
  static isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
  }
  static getHolidays(date) {
    const dateString = DateUtility.dateToDateString(date);
    const holidays = [];
    if (dateString.endsWith("12-25")) {
      holidays.push(Holiday.CHRISTMAS);
    }
    if (dateString.endsWith("10-31")) {
      holidays.push(Holiday.HALLOWEEN);
    }
    return holidays;
  }
  static getToday() {
    return new Date();
  }
}

class State extends AbstractState {
  constructor(daysVisible = 7, calendarEntries = {}) {
    super();
    this.daysVisible = daysVisible;
    this.calendarEntries = calendarEntries;
  }
  add(date, entry) {
    this.calendarEntries[date] = entry;
  }
  contains(date) {
    return Boolean(this.calendarEntries[date]);
  }
  addActivity(date, activity) {
    this.calendarEntries[date].addActivity(activity);
  }
  removeActivity(date, activityId) {
    this.calendarEntries[date].removeActivity(activityId);
  }
  updateActivity(entry, newActivityValue) {
    this.calendarEntries[entry.dateString].updateActivity(newActivityValue);
  }
  clearEntries() {
    this.calendarEntries = {};
  }
  setDaysVisible(newValue) {
    this.daysVisible = Number(newValue);
  }
  deleteBefore(date) {
    const keys = Object.keys(this.calendarEntries);
    const dateString = DateUtility.dateToDateString(date);
    for (let key of keys) {
      if (DateUtility.dateStringToDate(key) < date) {
        delete this.calendarEntries[key];
      }
    }
  }
  asData() {
    return JSON.parse(JSON.stringify(this));
  }
  static fromData(data) {
    if (!data) {
      return null;
    }
    for (let ce in data.calendarEntries) {
      const original = data.calendarEntries[ce];
      data.calendarEntries[ce] = CalendarEntry.fromData(original);
    }
    return new State(data.daysVisible, data.calendarEntries);
  }
}

class DayOfWeek {
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

class CalendarEntryActivity {
  constructor(text, color = Colors.TRANSPARENT, icon = Icons.EMPTY) {
    this.text = text;
    this.color = color;
    this.icon = icon;
    this.id = IdentifierUtility.generateRandomId();
  }
  static fromData(data) {
    return new CalendarEntryActivity(data.text, data.color, data.icon);
  }
}

class CalendarEntry {
  constructor(date, activities = []) {
    this.dateString = DateUtility.dateToDateString(date);
    this.activities = activities;
  }
  addActivity(activity) {
    this.activities.push(activity);
  }
  removeActivity(activityId) {
    this.activities.splice(
      this.activities.findIndex((activity) => activity.id === activityId),
      1
    );
  }
  updateActivity(newActivityValue) {
    this.activities.splice(
      this.activities.findIndex((activity) => activity.id === newActivityValue.id),
      1,
      newActivityValue
    );
  }
  static fromData(data) {
    return new CalendarEntry(
      DateUtility.dateStringToDate(data.dateString),
      data.activities.map((activity) =>
        CalendarEntryActivity.fromData(activity)
      )
    );
  }
}

class Model extends Observable {
  #state;
  constructor(state = new State()) {
    super();
    this.#state = state;
  }
  start() {
    this.#deleteEarlierEntries();
    this.notifyAll(this.#state);
  }
  setDaysVisible(newDaysVisible) {
    this.#state.setDaysVisible(newDaysVisible);
    this.notifyAll(this.#state);
  }
  addActivity(date, newActivity) {
    if (!this.#state.contains(DateUtility.dateToDateString(date))) {
      this.#state.add(
        DateUtility.dateToDateString(date),
        new CalendarEntry(date, [newActivity])
      );
    } else {
      this.#state.addActivity(DateUtility.dateToDateString(date), newActivity);
    }
    this.notifyAll(this.#state);
  }
  removeActivity(entry, activityId) {
    this.#state.removeActivity(entry.dateString, activityId);
    this.notifyAll(this.#state);
  }
  updateActivity(entry, newActivityValue) {
    this.#state.updateActivity(entry, newActivityValue);
    this.notifyAll(this.#state);
  }
  #deleteEarlierEntries() {
    // I don't need to display anything from before today, so let's save space
    const today = DateUtility.getToday();
    const deleteBefore = today;
    deleteBefore.setDate(today.getDate() - 1);
    this.#state.deleteBefore(deleteBefore);
  }
}

class CalendarEntryActivityRenderer {
  #controller;
  constructor(controller) {
    this.#controller = controller;
  }
  render(entry, activity) {
    const activityContainer = document.createElement("span");
    activityContainer.classList.add("calendar-entry__activity");
    const iconElement = document.createElement("span");
    iconElement.classList.add("icon");
    iconElement.textContent = activity.icon;
    const textElement = document.createElement("span");
    textElement.textContent = activity.text;
    activityContainer.append(iconElement, textElement);
    activityContainer.style.backgroundColor = activity.color;
    const deleteActivityButton = ButtonFactory.createIconButton(Icons.DELETE);
    deleteActivityButton.onclick = (e) => {
      e.stopPropagation();
      this.#controller.onActivityDeleted(entry, activity.id);
    };
    activityContainer.onclick = (e) => {
      e.stopPropagation();
      new AddEntryFormModal(
        (newActivityValue) => {
          newActivityValue.id = activity.id;
          this.#controller.onActivityUpdated(entry, newActivityValue);
        },
        entry.dateString,
        activity
      ).show();
    };
    activityContainer.append(deleteActivityButton);
    return activityContainer;
  }
}

class CalendarEntryRenderer {
  #controller;
  #activityRenderer;
  constructor(controller, activityRenderer) {
    this.#controller = controller;
    this.#activityRenderer = activityRenderer;
  }
  render(dateString, entry) {
    const container = document.createElement("div");
    container.id = dateString;
    container.classList.add("calendar-entry");
    this.#style(container, dateString, entry);
    const dateLabel = document.createElement("h3");
    dateLabel.classList.add("calendar-entry__header");
    dateLabel.textContent = this.#formatDateString(dateString);
    container.append(dateLabel);
    for (let activity of entry?.activities || []) {
      container.append(this.#activityRenderer.render(entry, activity));
    }
    container.onclick = (e) => {
      new AddEntryFormModal((newEntryValue) => {
        this.#controller.onActivityAdded(
          DateUtility.dateStringToDate(dateString),
          newEntryValue
        );
      }, dateString).show();
    };
    return container;
  }
  #style(container, dateString, entry) {
    container.style.borderColor = DateUtility.isWeekend(
      DateUtility.dateStringToDate(dateString)
    )
      ? Colors.WEEKEND
      : Colors.WEEKDAY;
  }
  #formatDateString(dateString) {
    const asDate = DateUtility.dateStringToDate(dateString);
    const holidays = DateUtility.getHolidays(asDate);
    return `${holidays.map((h) => h.icon).join("") || "🗓"} ${
      DayOfWeek.fromNumber(asDate.getDay()).name
    } ${asDate.toLocaleDateString()}`;
  }
}

class AddEntryFormModal extends Modal {
  constructor(onAdd, dateString, entry) {
    super();
    const formArea = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent =
      "Activity for " +
      DateUtility.dateStringToDate(dateString).toLocaleDateString();
    const form = document.createElement("form");
    const textLabel = document.createElement("label");
    textLabel.textContent = "Activity";
    const textInput = document.createElement("input");
    textInput.name = "text";
    textInput.required = true;
    textInput.minLength = 1;
    textInput.maxLength = 20;
    textInput.value = entry?.text || ""; // set default value
    textLabel.append(textInput);
    const colorSelect = SelectFactory.createSelect(
      "color",
      Colors.ALL,
      entry?.color || Colors.TRANSPARENT
    );
    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Color";
    colorLabel.append(colorSelect);
    const iconSelect = SelectFactory.createSelect(
      "icon",
      Icons.ALL,
      entry?.icon || Icons.EMPTY
    );
    const iconLabel = document.createElement("label");
    iconLabel.textContent = "Icon";
    iconLabel.append(iconSelect);

    const button = ButtonFactory.createSubmitButton(
      Boolean(entry) ? "Update" : "Add"
    );
    form.onsubmit = (e) => {
      e.preventDefault(); // so it doesn't try to submit the form
      const data = Object.fromEntries(new FormData(event.target));
      onAdd(CalendarEntryActivity.fromData(data));
      super.close();
    };
    form.append(textLabel, colorLabel, iconLabel, button);
    super.append(title, form);
  }
}

class CalendarListComponent extends Observer {
  #controller;
  #calendarListElement;
  #calendarEntryRenderer;
  #tracked;
  constructor(controller, calendarEntryRenderer) {
    super();
    this.#controller = controller;
    this.#calendarEntryRenderer = calendarEntryRenderer;
    this.#calendarListElement = document.getElementById("calendarList");
    this.#tracked = {
      calendarEntries: [],
    };
  }
  onUpdate(state) {
    let date = new Date();
    let thisLoad = [];
    this.#calendarListElement.textContent = ""; // remove all children
    for (let i = 0; i < state.daysVisible; i++) {
      const d = new Date(date); // clone to prevent weirdness
      const dateAsString = DateUtility.dateToDateString(d);
      const calendarEntryElement = this.#calendarEntryRenderer.render(
        dateAsString,
        state.calendarEntries[dateAsString]
      );
      this.#calendarListElement.append(calendarEntryElement);
      if (
        !this.#tracked.calendarEntries.includes(
          dateAsString
        )
      ) {
        UIAnimation.createAppearingAnimation(calendarEntryElement);
      }
      thisLoad.push(dateAsString);
      date.setDate(d.getDate() + 1);
    }
    this.#tracked.calendarEntries = thisLoad;
  }
}

class JumpToDaysInputComponent extends Observer {
  #jumpToDateInput;
  constructor() {
    super();
    this.#jumpToDateInput = document.getElementById("jumpToDateInput");
    this.#jumpToDateInput.onchange = (e) => {
      const jumpToMe = document.getElementById(
        DateUtility.inputDateStringToDateString(this.#jumpToDateInput.value)
      );
      if (Boolean(jumpToMe)) {
        jumpToMe.scrollIntoView();
      } else {
        document.getElementById("calendarList").scrollTo(0, 0);
      }
    };
  }
}

class VisibleDaysInputComponent extends Observer {
  #visibleDaysInput;
  #controller;
  constructor(controller) {
    super();
    this.#controller = controller;
    this.#visibleDaysInput = document.getElementById("visibleDaysInput");
    this.#visibleDaysInput.value = 7;
    const visibleDaysInputListener = (e) =>
      this.#controller.onVisibleDaysInputUpdated(this.#visibleDaysInput.value);
    this.#visibleDaysInput.onchange = visibleDaysInputListener;
  }
  onUpdate(state) {
    this.#visibleDaysInput.value = state.daysVisible;
  }
}

class Controller {
  #model;
  constructor(model) {
    this.#model = model;
  }
  onVisibleDaysInputUpdated(newVisibleDays) {
    this.#model.setDaysVisible(newVisibleDays);
  }
  onActivityAdded(date, newActivity) {
    this.#model.addActivity(date, newActivity);
  }
  onActivityDeleted(entry, activityId) {
    this.#model.removeActivity(entry, activityId);
  }
  onActivityUpdated(entry, newActivityValue) {
    this.#model.updateActivity(entry, newActivityValue);
  }
}

class LocalStorageService {
  static #CALENDAR_DATA_KEY = "kid_calendar";
  constructor() {}
  save(data) {
    localStorage.setItem(
      LocalStorageService.#CALENDAR_DATA_KEY,
      JSON.stringify(data, null, 2)
    );
  }
  async open(callback) {
    const stringData = localStorage.getItem(
      LocalStorageService.#CALENDAR_DATA_KEY
    );
    if (!stringData) {
      return Promise.resolve(null);
    } else {
      return Promise.resolve(JSON.parse(stringData));
    }
  }
}

class RemoteStorageService {
  #environment;
  constructor(environment) {
    this.#environment = environment;
  }
  save(data) {
    fetch(
      `${this.#environment.rootUrl}/state`,
      this.#getPostRequestOptions(data)
    ).catch((error) => new ErrorModal("Something went wrong: " + error).show());
  }
  async open() {
    const response = await fetch(
      `${this.#environment.rootUrl}/state/${this.#getUsername()}`,
      this.#getGetRequestOptions()
    );
    const json = await response.json();
    return json;
  }
  #getToken() {
    return localStorage.getItem(this.#environment.tokenKey);
  }
  #getUsername() {
    return JSON.parse(atob(this.#getToken().split('.')[1])).sub
  }
  #getGetRequestOptions() {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${this.#getToken()}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    return requestOptions;
  }
  #getPostRequestOptions(data) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${this.#getToken()}`);
    myHeaders.append("Content-Type", "application/json");
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: "follow",
    };
    return requestOptions;
  }
}

class StorageManager {
  constructor(implementation) {
    this.implementation = implementation;
  }
  onUpdate(state) {
    this.implementation.save(state);
  }
}
