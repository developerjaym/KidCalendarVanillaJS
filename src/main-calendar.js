import {
  RemoteStorageService,
  LocalStorageService,
  CalendarPage,
} from "./modules/calendar/calendar.js";
import environment from "./modules/environments/environment.js";
import { Toast } from "./modules/common/ui.js";

(async () => {
  const storageImplementation =
    environment.storageSolution === "ls"
      ? new LocalStorageService(environment)
      : new RemoteStorageService(environment);
  try {
    Toast.show("Welcome!");
    await new CalendarPage(storageImplementation).onInit();
  } catch (e) {
    const url = new URL(window.location.href + "authentication");
    url.searchParams.append("from", window.location.href);
    window.history.pushState({}, "", url);
    window.location = url; // redirect for authentication
  }
})();
