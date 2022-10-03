import {
  AuthenticationService,
  AuthenticationModel,
  AuthenticationController,
  AuthenticationView,
  Redirecter,
} from "../modules/authentication/authentication.js";
import environment from "../modules/common/environment.js";

(async () => {
  const authService = new AuthenticationService(environment);
  const model = new AuthenticationModel(authService);
  const controller = new AuthenticationController(model);
  const view = new AuthenticationView(controller);
  const redirecter = new Redirecter();
  model.addObserver(view);
  model.addObserver(redirecter);
  model.start();
})();
