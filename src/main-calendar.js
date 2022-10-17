import {
  RemoteStorageService,
  LocalStorageService,
  CalendarPage
} from "./modules/calendar/calendar.js";
import environment from "./modules/common/environment.js";

(async () => {
  // const storageImplementation = new RemoteStorageService(environment);
  const storageImplementation = new LocalStorageService(environment);
  try {
    await new CalendarPage(storageImplementation).onInit();
  } catch (e) {
    const url = new URL(window.location.href + "authentication");
    url.searchParams.append("from", window.location.href);
    window.history.pushState({}, "", url);
    window.location = url; // redirect for authentication
  }
})();
