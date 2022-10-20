import {
  RemoteStorageService,
  LocalStorageService,
  CalendarPage
} from "./modules/calendar/calendar.js";
import environment from "./modules/environments/environment.js";

(async () => {
  const storageImplementation = environment.storageSolution === "ls" ? new LocalStorageService(environment) : new RemoteStorageService(environment);;
  try {
    await new CalendarPage(storageImplementation).onInit();
  } catch (e) {
    const url = new URL(window.location.href + "authentication");
    url.searchParams.append("from", window.location.href);
    window.history.pushState({}, "", url);
    window.location = url; // redirect for authentication
  }
})();
