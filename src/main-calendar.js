import {
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
} from "./modules/calendar/calendar.js";
import environment from "./modules/common/environment.js";

(async () => {
  // const storageImplementation = new RemoteStorageService(environment);
  const storageImplementation = new LocalStorageService(environment);
  const storageManager = new StorageManager(storageImplementation);
  try {
    const existing = await storageImplementation.open();
    const startingState = existing;
    const model = new Model();
    const controller = new Controller(model);
    const calendarListComponent = new CalendarListComponent(
      controller,
      new CalendarEntryRenderer(
        controller,
        new CalendarEntryActivityRenderer(controller)
      )
    );
    const visibleDaysInput = new VisibleDaysInputComponent(controller);
    const jumpToDateInput = new JumpToDaysInputComponent();
    model.addObserver(visibleDaysInput);
    model.addObserver(calendarListComponent);
    model.addObserver(storageManager);
    model.onInitialLoad(startingState);
  } catch (e) {
    const url = new URL(window.location.href + "authentication");
    url.searchParams.append("from", window.location.href);
    window.history.pushState({}, "", url);
    window.location = url; // redirect for authentication
  }
})();
