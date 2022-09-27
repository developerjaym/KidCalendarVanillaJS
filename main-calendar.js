import {StorageManager, RemoteStorageService, LocalStorageService, Controller, State, Model, CalendarListComponent, VisibleDaysInputComponent, CalendarEntryRenderer, CalendarEntryActivityRenderer, JumpToDaysInputComponent} from './modules/calendar/calendar.js';
import environment from './modules/common/environment.js'
(async () => {
    // const storageImplementation = new RemoteStorageService(environment);
    const storageImplementation = new LocalStorageService(environment);
    const storageManager = new StorageManager(storageImplementation);
    try {
        const existing = await storageImplementation.open();
        const startingState = State.fromData(existing) || new State();
        const model = new Model(startingState);
        const controller = new Controller(model);
        const calendarListComponent = new CalendarListComponent(controller, new CalendarEntryRenderer(controller, new CalendarEntryActivityRenderer(controller)));
        const visibleDaysInput = new VisibleDaysInputComponent(controller);
        const jumpToDateInput = new JumpToDaysInputComponent();
        model.addObserver(visibleDaysInput);
        model.addObserver(calendarListComponent);
        model.addObserver(storageManager);
        model.start();
    }
    catch (e) {
        console.log(e);
        // window.location.href = "authentication.html"; // redirect for authentication
    }
})()