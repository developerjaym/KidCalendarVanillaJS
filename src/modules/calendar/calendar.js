import {
  ButtonFactory,
  Colors,
  ErrorModal,
  Icons,
  Modal,
  SelectFactory,
  UIAnimation,
} from "../common/ui.js";
import { IdentifierUtility, Observable, Observer } from "../common/utility.js";
import { HolidayUtility, LocalDate } from "./LocalDate.js";

class RepeatInterval {
  static DAILY = new RepeatInterval(1, "Daily");
  static WEEKLY = new RepeatInterval(7, "Weekly");
  static NONE = new RepeatInterval(0, "None");
  constructor(interval, name) {
    this.interval = interval;
    this.name = name;
  }
  static fromName(name) {
    if (RepeatInterval.DAILY.name === name) {
      return RepeatInterval.DAILY;
    } else if (RepeatInterval.WEEKLY.name === name) {
      return RepeatInterval.WEEKLY;
    } else {
      return RepeatInterval.NONE;
    }
  }
}

class Repeat {
  constructor(interval, untilString) {
    this.interval = interval;
    this.until = LocalDate.fromISOString(untilString);
  }
}

class CalendarEntryActivityHelper {
  static create({ text, color = Colors.TRANSPARENT, icon = Icons.EMPTY }) {
    return {
      text,
      color,
      icon,
      id: IdentifierUtility.generateRandomId(),
    };
  }
}

class CalendarEntryHelper {
  static create(localDate, activities = []) {
    return {
      dateString: localDate.toISOString(),
      activities: activities,
    };
  }
  static addActivity(entry, activity) {
    entry.activities.push(activity);
  }
  static removeActivity(entry, activityId) {
    entry.activities.splice(
      entry.activities.findIndex((activity) => activity.id === activityId),
      1
    );
  }
  static updateActivity(entry, newActivityValue) {
    entry.activities.splice(
      entry.activities.findIndex(
        (activity) => activity.id === newActivityValue.id
      ),
      1,
      newActivityValue
    );
  }
}

class StateHelper {
  static create() {
    return {
      daysVisible: 7,
      calendarEntries: {},
    };
  }
  static add(state, date, entry) {
    state.calendarEntries[date] = entry;
  }
  static contains(state, date) {
    return Boolean(state.calendarEntries[date]);
  }
  static addActivity(state, date, activity) {
    CalendarEntryHelper.addActivity(state.calendarEntries[date], activity);
  }
  static removeActivity(state, date, activityId) {
    CalendarEntryHelper.removeActivity(state.calendarEntries[date], activityId);
  }
  static updateActivity(state, entry, newActivityValue) {
    CalendarEntryHelper.updateActivity(
      state.calendarEntries[entry.dateString],
      newActivityValue
    );
  }
  static clearEntries(state) {
    state.calendarEntries = {};
  }
  static setDaysVisible(state, newValue) {
    state.daysVisible = Number(newValue);
  }
  static deleteBefore(state, localDate) {
    const keys = Object.keys(state.calendarEntries);
    for (let key of keys) {
      if (localDate.isGreaterThan(LocalDate.fromISOString(key))) {
        delete state.calendarEntries[key];
      }
    }
  }
}

class Model extends Observable {
  #state;
  constructor() {
    super();
  }
  onInitialLoad(state = StateHelper.create()) {
    this.#state = state;
    this.#deleteEarlierEntries();
    this.notifyAll(this.#state);
  }
  setDaysVisible(newDaysVisible) {
    StateHelper.setDaysVisible(this.#state, newDaysVisible);
    this.notifyAll(this.#state);
  }
  addActivity(date, newActivity) {
    const repeat = new Repeat(
      RepeatInterval.fromName(newActivity.repeatFrequency),
      newActivity.repeatUntil || date.toISOString()
    );
    let dateToAddTo = date.clone();
    while (
      repeat.until.isGreaterThan(dateToAddTo) ||
      repeat.until.isEqual(dateToAddTo)
    ) {
      const activityToAdd = CalendarEntryActivityHelper.create(newActivity);
      if (!StateHelper.contains(this.#state, dateToAddTo.toISOString())) {
        StateHelper.add(
          this.#state,
          dateToAddTo.toISOString(),
          CalendarEntryHelper.create(dateToAddTo, [activityToAdd])
        );
      } else {
        StateHelper.addActivity(
          this.#state,
          dateToAddTo.toISOString(),
          activityToAdd
        );
      }
      for (let i = 0; i < repeat.interval.interval; i++) {
        dateToAddTo = dateToAddTo.next();
      }
    }
    this.notifyAll(this.#state);
  }
  removeActivity(entry, activityId) {
    StateHelper.removeActivity(this.#state, entry.dateString, activityId);
    this.notifyAll(this.#state);
  }
  updateActivity(entry, newActivityValue, activityId) {
    const activity = CalendarEntryActivityHelper.create(newActivityValue);
    activity.id = activityId;
    StateHelper.updateActivity(this.#state, entry, activity);
    this.notifyAll(this.#state);
  }
  #deleteEarlierEntries() {
    // I don't need to display anything from before today, so let's save space
    StateHelper.deleteBefore(this.#state, LocalDate.today().prior());
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
          this.#controller.onActivityUpdated(
            entry,
            newActivityValue,
            activity.id
          );
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
          LocalDate.fromISOString(dateString),
          newEntryValue
        );
      }, dateString).show();
    };
    return container;
  }
  #style(container, dateString, entry) {
    container.style.borderColor = LocalDate.fromISOString(
      dateString
    ).isWeekend()
      ? Colors.WEEKEND
      : Colors.WEEKDAY;
  }
  #formatDateString(dateString) {
    const asDate = LocalDate.fromISOString(dateString);
    const holidays = HolidayUtility.getHolidays(asDate);
    return `${holidays.map((h) => h.icon).join("") || "🗓"} ${
      asDate.getDayOfWeek().name
    } ${asDate.toLocaleString()}`;
  }
}

class AddEntryFormModal extends Modal {
  constructor(onAdd, dateString, entry) {
    super();
    const formArea = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent =
      "Activity for " + LocalDate.fromISOString(dateString).toLocaleString();
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

    const frequencyLabel = document.createElement("label");
    frequencyLabel.textContent = "Repeat Frequency";
    const frequencyInput = SelectFactory.createSelect("repeatFrequency", [
      RepeatInterval.DAILY.name,
      RepeatInterval.WEEKLY.name,
      RepeatInterval.NONE.name,
    ]);
    frequencyLabel.append(frequencyInput);

    const untilLabel = document.createElement("label");
    const until = document.createElement("input");
    until.type = "date";
    until.name = "repeatUntil";
    untilLabel.textContent = "Repeat Until";
    untilLabel.appendChild(until);

    const button = ButtonFactory.createSubmitButton(
      Boolean(entry) ? "Update" : "Add"
    );
    form.onsubmit = (e) => {
      e.preventDefault(); // so it doesn't try to submit the form
      const data = Object.fromEntries(new FormData(e.target));
      onAdd(data);
      super.close();
    };
    form.append(
      textLabel,
      colorLabel,
      iconLabel,
      ...[
        Boolean(entry) ? [] : frequencyLabel,
        Boolean(entry) ? [] : untilLabel,
      ],
      button
    );
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
    let date = LocalDate.today();
    let thisLoad = [];
    this.#calendarListElement.textContent = ""; // remove all children
    for (let i = 0; i < state.daysVisible; i++) {
      const d = date.clone(); // clone to prevent weirdness
      const dateAsString = d.toISOString();
      const calendarEntryElement = this.#calendarEntryRenderer.render(
        dateAsString,
        state.calendarEntries[dateAsString]
      );
      this.#calendarListElement.append(calendarEntryElement);
      if (!this.#tracked.calendarEntries.includes(dateAsString)) {
        UIAnimation.createAppearingAnimation(calendarEntryElement);
      }
      thisLoad.push(dateAsString);
      date = d.next();
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
      const jumpToMe = document.getElementById(this.#jumpToDateInput.value);
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
  onActivityUpdated(entry, newActivityValue, activityId) {
    this.#model.updateActivity(entry, newActivityValue, activityId);
  }
}

class LocalStorageService {
  static #CALENDAR_DATA_KEY = "kid_calendar";
  #environment;
  constructor(environment) {
    this.#environment = environment;
  }
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
    return JSON.parse(atob(this.#getToken().split(".")[1])).sub;
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

export {
  StorageManager,
  RemoteStorageService,
  LocalStorageService,
  Controller,
  Model,
  CalendarListComponent,
  VisibleDaysInputComponent,
  CalendarEntryRenderer,
  CalendarEntryActivityRenderer,
  JumpToDaysInputComponent,
};
