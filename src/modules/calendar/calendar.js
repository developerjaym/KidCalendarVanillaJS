import {
  Observable,
  Observer,
  AbstractState,
  IdentifierUtility,
} from "../common/utility.js";
import {
  ButtonFactory,
  Colors,
  ErrorModal,
  Modal,
  UIAnimation,
  SelectFactory,
  Icons,
} from "../common/ui.js";
import {LocalDate, HolidayUtility} from "./LocalDate.js";



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
  deleteBefore(localDate) {
    const keys = Object.keys(this.calendarEntries);
    for (let key of keys) {
      if(localDate.isGreaterThan(LocalDate.fromISOString(key)))  {
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
  constructor(localDate, activities = []) {
    this.dateString = localDate.toISOString();
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
      this.activities.findIndex(
        (activity) => activity.id === newActivityValue.id
      ),
      1,
      newActivityValue
    );
  }
  static fromData(data) {
    return new CalendarEntry(
      LocalDate.fromISOString(data.dateString),
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
    if (!this.#state.contains(date.toISOString())) {
      this.#state.add(
        date.toISOString(),
        new CalendarEntry(date, [newActivity])
      );
    } else {
      this.#state.addActivity(date.toISOString(), newActivity);
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
    this.#state.deleteBefore(LocalDate.today().prior());
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
          LocalDate.fromISOString(dateString),
          newEntryValue
        );
      }, dateString).show();
    };
    return container;
  }
  #style(container, dateString, entry) {
    container.style.borderColor = 
      LocalDate.fromISOString(dateString).isWeekend()
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
      "Activity for " +
      LocalDate.fromISOString(dateString).toLocaleString();
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
    let date =  LocalDate.today();
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
      console.log(this.#jumpToDateInput.value);
      const jumpToMe = document.getElementById(
        this.#jumpToDateInput.value
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
  State,
  Model,
  CalendarListComponent,
  VisibleDaysInputComponent,
  CalendarEntryRenderer,
  CalendarEntryActivityRenderer,
  JumpToDaysInputComponent,
};
