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
    this.id = IdentifierUtility.generateRandomId();
  }
}

class CalendarEntryActivityHelper {
  static create({ text, color = Colors.TRANSPARENT, icon = Icons.EMPTY, series = IdentifierUtility.generateRandomId(), id = IdentifierUtility.generateRandomId() }) {
    return {
      text,
      color,
      icon,
      series,
      id,
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
    Object.values(state.calendarEntries).forEach(
      (entry) =>
        (entry.activities = entry.activities.filter(
          (activity) => activity.id !== activityId
        ))
    );
  }
  static updateActivity(state, activityId, newActivityValue) {
    const entryToUpdate = Object.values(state.calendarEntries).find((entry) =>
      entry.activities.some((activity) => activity.id === activityId)
    );
    const activityIndex = entryToUpdate.activities.indexOf(
      (activity) => activity.id === activityId
    );
    entryToUpdate.activities.splice(activityIndex, 1, newActivityValue);
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
    this.notifyAll({
      state: this.#state,
      type: EventTypes.CALENDAR_LOAD,
    });
  }
  setDaysVisible(newDaysVisible) {
    StateHelper.setDaysVisible(this.#state, newDaysVisible);
    this.notifyAll({
      state: this.#state,
      type: EventTypes.CALENDAR_DAYS_VISIBLE
    });
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
      const activityToAdd = CalendarEntryActivityHelper.create({...newActivity, series: repeat.id});
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
    this.notifyAll({
      state: this.#state,
      type: EventTypes.CALENDAR_ADD
    });
  }
  removeActivity(activityId) {
    StateHelper.removeActivity(this.#state, activityId);
    this.notifyAll({
      state: this.#state,
      type: EventTypes.CALENDAR_REMOVE
    });
  }
  updateActivity(newActivityValue, activityId) {
    const activity = CalendarEntryActivityHelper.create({...newActivityValue, id: activityId});
    StateHelper.updateActivity(this.#state, activityId, activity);
    this.notifyAll({
      state: this.#state,
      type: EventTypes.CALENDAR_UPDATE
    });
  }
  updateSeries(newActivityValue, series, onlyUpdateThisAndFutureActivities) {
    // TODO
    // find all activities that need updating (based on the series and the boolean onlyUpdateThisAndFutureActivities)
    // StateHelper.updateActivity
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
    for (let key of this.#activityComponents.keys()) {
      if (!newEntry.activities.some((activity) => activity.id === key)) {
        this.#activityComponents.delete(key);
        UIAnimation.createDisappearingAnimation(document.getElementById(`${key}`));
      }
    }
    for (let activity of newEntry?.activities || []) {
      if (this.#activityComponents.has(activity.id)) {
        // update
        this.#activityComponents.get(activity.id).onChange(activity);
      } else {
        // add
        const newComponent = new CalendarActivityComponent(
          activity,
          this.#dateString,
          this.#controller
        );
        this.#activityComponents.set(activity.id, newComponent);
        this.#element.appendChild(newComponent.getElement());
        UIAnimation.createAppearingAnimation(newComponent.getElement());
      }
    }
  }
}

class CalendarActivityComponent {
  #activity;
  #element;
  #controller;
  #textElement;
  #iconElement;
  constructor(activity, dateString, controller) {
    this.#activity = activity;
    this.#controller = controller;
    [this.#element, this.#textElement, this.#iconElement] = this.#createElement(dateString);
  }
  #createElement(dateString) {
    const activityContainer = document.createElement("span");
    activityContainer.id = this.#activity.id;
    activityContainer.classList.add("calendar-entry__activity");
    const iconElement = document.createElement("span");
    iconElement.classList.add("icon");
    iconElement.textContent = this.#activity.icon;
    const textElement = document.createElement("span");
    textElement.textContent = this.#activity.text;
    activityContainer.append(iconElement, textElement);
    activityContainer.style.backgroundColor = this.#activity.color;
    const deleteActivityButton = ButtonFactory.createIconButton(Icons.DELETE);
    deleteActivityButton.onclick = (e) => {
      e.stopPropagation();
      this.#controller.onActivityDeleted(this.#activity.id);
    };
    activityContainer.onclick = (e) => {
      e.stopPropagation();
      new AddActivityFormModal(
        (newActivityValue) => {
          this.#controller.onActivityUpdated(newActivityValue, this.#activity.id);
        },
        dateString,
        this.#activity
      ).show();
    };
    activityContainer.append(deleteActivityButton);
    return [activityContainer, textElement, iconElement];
  }
  getElement() {
    return this.#element;
  }
  onChange(newActivity) {
    if (newActivity.text !== this.#activity.text) {
      this.#textElement.textContent = newActivity.text;
    }
    if(newActivity.icon !== this.#activity.icon) {
      this.#iconElement.textContent = newActivity.icon;
    }
    if(newActivity.color !== this.#activity.color) {
      this.#element.style.backgroundColor = newActivity.color;
    }
    this.#activity = newActivity;
  }
}

class CalendarListComponent extends Observer {
  #controller;
  #calendarListElement;
  #calendarEntryComponents;
  constructor(controller) {
    super();
    this.#controller = controller;
    this.#calendarListElement = document.getElementById("calendarList");
    this.#calendarEntryComponents = [];
  }
  onUpdate({ state, type }) {
    // TODO look at the other properties on the event to selectively re-render
    document.getElementById('listLoadingWarning')?.remove();
    let date = LocalDate.today();

    const arrayOfDateStrings = [];
    for (let i = 0; i < state.daysVisible; i++) {
      const d = date.clone(); // clone to prevent weirdness
      arrayOfDateStrings.push(d.toISOString());
      date = d.next();
    }
    const removeMe = [];
    for (let calendarEntryComponent of this.#calendarEntryComponents) {
      if (
        !arrayOfDateStrings.includes(calendarEntryComponent.getElement().id)
      ) {
        //remove
        removeMe.push(calendarEntryComponent);
        UIAnimation.createDisappearingAnimation(calendarEntryComponent.getElement());
      }
    }
    this.#calendarEntryComponents = this.#calendarEntryComponents.filter(comp => !removeMe.includes(comp));
    for (let dateString of arrayOfDateStrings) {
      const matchingEntryComponent = this.#calendarEntryComponents.find(
        (entryComponent) => entryComponent.getElement().id === dateString
      );
      //change
      if (matchingEntryComponent) {
        matchingEntryComponent.onChange(state.calendarEntries[dateString]);
      }
      //add
      else {
        this.#addNewCalendarEntryComponent(dateString, state);
      }
    }
  }

  #addNewCalendarEntryComponent(dateString, state) {
    const calendarEntryComponent = new CalendarEntryComponent(
      dateString,
      this.#controller
    );
    calendarEntryComponent.onChange(state.calendarEntries[dateString]);
    const calendarEntryElement = calendarEntryComponent.getElement();
    this.#calendarListElement.append(calendarEntryElement);
    UIAnimation.createAppearingAnimation(calendarEntryElement);
    this.#calendarEntryComponents.push(calendarEntryComponent);
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
  onUpdate({ state, type }) {
    if (["calendar/daysVisible", "calendar/load"].includes(type)) {
      this.#visibleDaysInput.value = state.daysVisible;
    }
  }
}

class CalendarPage {
  #model;
  #controller;
  #jumpToDaysInputComponent;
  #visibleDaysInputComponent;
  #calendarListComponent;
  #storageManager;
  constructor(storageImplementation) {
    this.#storageManager = new StorageManager(storageImplementation);
    this.#model = new Model();
    this.#controller = new Controller(this.#model);
    this.#jumpToDaysInputComponent = new JumpToDaysInputComponent();
    this.#visibleDaysInputComponent = new VisibleDaysInputComponent(this.#controller);
    this.#calendarListComponent = new CalendarListComponent(this.#controller);
    this.#model.addObserver(this.#visibleDaysInputComponent);
    this.#model.addObserver(this.#calendarListComponent);
    this.#model.addObserver(this.#storageManager);
  }
  async onInit() {
    const startingState = await this.#storageManager.open()
    this.#model.onInitialLoad(startingState);
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
  async open() {
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

class StorageManager extends Observer {
  constructor(implementation) {
    super();
    this.implementation = implementation;
  }
  onUpdate({ state }) {
    this.implementation.save(state);
  }
  async open() {
    return this.implementation.open();
  }
}

export {
  CalendarPage,
  RemoteStorageService,
  LocalStorageService,
};
