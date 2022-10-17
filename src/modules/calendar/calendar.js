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

class AddActivityFormModal extends Modal {
  constructor(onAdd, dateString, activity) {
    super();
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
    textInput.value = activity?.text || ""; // set default value
    textLabel.append(textInput);
    const colorSelect = SelectFactory.createSelect(
      "color",
      Colors.ALL,
      activity?.color || Colors.TRANSPARENT
    );
    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Color";
    colorLabel.append(colorSelect);
    const iconSelect = SelectFactory.createSelect(
      "icon",
      Icons.ALL,
      activity?.icon || Icons.EMPTY
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
      Boolean(activity) ? "Update" : "Add"
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
        Boolean(activity) ? [] : frequencyLabel,
        Boolean(activity) ? [] : untilLabel,
      ],
      button
    );
    super.append(title, form);
  }
}

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
    state.calendarEntries[date].activities.push(activity);
  }
  static removeActivity(state, activityId) {
    Object.values(state.calendarEntries).forEach(entry => entry.activities = entry.activities.filter(activity => activity.id !== activityId))
  }
  static updateActivity(state, activityId, newActivityValue) {
    const entryToUpdate = Object.values(state.calendarEntries).find(entry => entry.activities.some(activity => activity.id === activityId));
    const activityIndex = entryToUpdate.activities.indexOf(activity => activity.id === activityId);
    entryToUpdate.activities.splice(activityIndex, 1, newActivityValue)
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

class EventTypes {
  static CALENDAR_LOAD = "calendar/load";
  static CALENDAR_DAYS_VISIBLE = "calendar/daysVisible";
  static CALENDAR_ADD = "calendar/add";
  static CALENDAR_UPDATE = "calendar/update";
  static CALENDAR_REMOVE = "calendar/remove";
}

class Model extends Observable {
  #state;
  constructor() {
    super();
  }
  onInitialLoad(state) {
    this.#state = state || StateHelper.create();
    this.#deleteEarlierEntries();
    this.notifyAll({state: this.#state, type: "calendar/load", added: Object.keys(this.#state.calendarEntries), removed: []});
  }
  setDaysVisible(newDaysVisible) {
    StateHelper.setDaysVisible(this.#state, newDaysVisible);
    // TODO figure out the dates that got added or removed from state.calendarEntries
    this.notifyAll({state: this.#state, type: "calendar/daysVisible", added: Object.keys(this.#state.calendarEntries), removed: []});
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
    // TODO figure out what dates got changed
    this.notifyAll({state: this.#state, type: "calendar/add", added: Object.keys(this.#state.calendarEntries), removed: []});
  }
  removeActivity(activityId) {
    StateHelper.removeActivity(this.#state, activityId);
    // TODO figure out what dates got changed
    this.notifyAll({state: this.#state, type: "calendar/remove", added: Object.keys(this.#state.calendarEntries), removed: []});
  }
  updateActivity(newActivityValue, activityId) {
    const activity = CalendarEntryActivityHelper.create(newActivityValue);
    activity.id = activityId;
    StateHelper.updateActivity(this.#state, activityId, activity);
    // TODO figure out what dates got updated
    this.notifyAll({state: this.#state, type: "calendar/update", added: Object.keys(this.#state.calendarEntries), removed: []});
  }
  #deleteEarlierEntries() {
    // I don't need to display anything from before today, so let's save space
    StateHelper.deleteBefore(this.#state, LocalDate.today().prior());
  }
}


class CalendarEntryComponent {
  #element;
  #activityComponents;
  #controller;
  #dateString;
  constructor(dateString, controller) {
    this.#dateString = dateString;
    this.#activityComponents = new Map();
    this.#controller = controller;
    this.#element = this.#createElement(dateString);
  }
  #createElement(dateString) {
    const container = document.createElement("div");
    container.id = dateString;
    container.classList.add("calendar-entry");
    this.#style(container, dateString);
    const dateLabel = document.createElement("h3");
    dateLabel.classList.add("calendar-entry__header");
    dateLabel.textContent = this.#formatDateString(dateString);
    container.append(dateLabel);
    container.onclick = (e) => {
      new AddActivityFormModal((newEntryValue) => {
        this.#controller.onActivityAdded(
          LocalDate.fromISOString(dateString),
          newEntryValue
        );
      }, dateString).show();
    };
    return container;
  }
  #style(container, dateString) {
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
  getElement() {
    return this.#element;
  }
  onChange(newEntry) {
    // remove activities that don't exist
    for(let key of this.#activityComponents.keys()){
      if(newEntry.activities.none(activity => activity.id === key)) {
        console.log("deleting on change", key);
        this.#activityComponents.delete(activity.id);
        document.getElementById(`${activity.id}`).remove()
      }
    }
    for(let activity of newEntry?.activities || []) {
      if(this.#activityComponents.has(activity.id)) {
        // update
        console.log("updating on change", activity.id);
        this.#activityComponents.get(activity.id).onChange(activity);
      }
      else {
        // add
        console.log("adding on change", activity.id);
        const newComponent = new CalendarActivityComponent(activity, this.#dateString, this.#controller);
        this.#activityComponents.set(activity.id, newComponent);
        this.#element.appendChild(newComponent.getElement());
      }
    }
  }
}

class CalendarActivityComponent {
  #activity;
  #element;
  #controller;
  constructor(activity, dateString, controller) {
    this.#activity = activity;
    this.#controller = controller;
    this.#element = this.#createElement(this.#activity, dateString);
  }
  #createElement(activity, dateString) {
      const activityContainer = document.createElement("span");
      activityContainer.id = activity.id;
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
        this.#controller.onActivityDeleted(activity.id);
      };
      activityContainer.onclick = (e) => {
        e.stopPropagation();
        new AddActivityFormModal(
          (newActivityValue) => {
            this.#controller.onActivityUpdated(
              newActivityValue,
              activity.id
            );
          },
          dateString,
          activity
        ).show();
      };
      activityContainer.append(deleteActivityButton);
      return activityContainer;
  }
  getElement() {
    return this.#element;
  }
  onChange(newActivity) {
    console.log("activity::onChange", newActivity);
    // change text
    // change icon
    // change background-color
    if(newActivity.text !== this.#activity.text) {

    }
    this.#activity = newActivity;
  }
}

class CalendarListComponent extends Observer {
  #controller;
  #calendarListElement;
  #tracked;
  #calendarEntryComponents;
  constructor(controller) {
    super();
    this.#controller = controller;
    this.#calendarListElement = document.getElementById("calendarList");
    this.#tracked = {
      calendarEntries: [],
    };
    this.#calendarEntryComponents = [];
  }
  onUpdate({state, added, removed, type}) {
    // TODO look at the other properties on the event to selectively re-render
    /* 
    { changed: [{
      date: "2022-10-20",
      activities: ["1234", "56789"],
      type: "add/date" (|"")
    }]}
    */
   /*
    addedDates: ["2020-10-10"],
    removedDates: ["2020-10-11"]

    Let's say I have a CalendarListComponent that holds an array of CalendarEntryComponents.
    And let's say CalendarEntryComponent holds an array of CalendarActivityComponents.
    When a new state comes through,
       CalendarListComponent can tell each CalendarEntryComponent
         "here is what your 'day' looks like now"
         The CalendarEntryComponent can then delete itself
         OR tell each CalendarActivityComponent
           "here is what your 'activity' looks like now"
   */
    let date = LocalDate.today();
    let thisLoad = [];
    this.#calendarListElement.textContent = ""; // remove all children
    for (let i = 0; i < state.daysVisible; i++) {
      const d = date.clone(); // clone to prevent weirdness
      const dateAsString = d.toISOString();
      const calendarEntryComponent = new CalendarEntryComponent(dateAsString, this.#controller);
      calendarEntryComponent.onChange(state.calendarEntries[dateAsString]);
      const calendarEntryElement = calendarEntryComponent.getElement();
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
  onUpdate({state, type}) {
    if(type === "calendar/daysVisible") {
      this.#visibleDaysInput.value = state.daysVisible;
    }
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
  onActivityDeleted(activityId) {
    this.#model.removeActivity(activityId);
  }
  onActivityUpdated(newActivityValue, activityId) {
    this.#model.updateActivity(newActivityValue, activityId);
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
  onUpdate({state}) {
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
  JumpToDaysInputComponent,
};
