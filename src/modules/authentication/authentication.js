import { ButtonFactory, ErrorModal, Modal } from "../common/ui.js";
import { Observable, Observer } from "../common/utility.js";

class AuthenticationService {
  #environment;
  constructor(environment) {
    this.#environment = environment;
  }
  async signUp(data) {
    return this.#fetchForToken(`${this.#environment.rootUrl}/auth/user`, data);
  }
  async signIn(data) {
    return this.#fetchForToken(
      `${this.#environment.rootUrl}/auth/token`,
      data,
      true
    );
  }
  async #fetchForToken(url, data, basic = false) {
    try {
      const response = await fetch(
        url,
        this.#getPostRequestOptions(data, basic)
      );
      const json = await response.json();
      this.#setToken(json.token);
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }
  isAuthenticated() {
    const token = this.#getToken();
    if (token) {
      return (
        new Date(JSON.parse(atob(token.split(".")[1])).exp * 1000) > new Date()
      );
    }
    return false;
  }
  #getToken() {
    return localStorage.getItem(this.#environment.tokenKey);
  }
  #setToken(newTokenValue) {
    localStorage.setItem(this.#environment.tokenKey, newTokenValue);
  }
  #getPostRequestOptions(data, basic = false) {
    const myHeaders = new Headers();
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow",
    };
    myHeaders.append("Content-Type", "application/json");
    if (basic) {
      myHeaders.append(
        "Authorization",
        "basic " + btoa(`${data.username}:${data.password}`)
      );
    } else {
      requestOptions.body = JSON.stringify(data);
    }

    return requestOptions;
  }
}

class AuthenticationModel extends Observable {
  #authenticationService;
  #state;
  constructor(authService) {
    super();
    this.#authenticationService = authService;
    this.#state = AuthenticationStateHelper.create(
      this.#authenticationService.isAuthenticated()
    );
  }
  start() {
    this.notifyAll(this.#state);
  }
  async signIn(data) {
    const success = await this.#authenticationService.signIn(data);
    this.#state.authenticated = success;
    this.#state.error = !success;
    this.notifyAll(this.#state);
  }
  async signUp(data) {
    const success = await this.#authenticationService.signUp(data);
    this.#state.authenticated = success;
    this.#state.error = !success;
    this.notifyAll(this.#state);
  }
}

class AuthenticationController {
  #model;
  constructor(model) {
    this.#model = model;
  }
  onSignUp(data) {
    this.#model.signUp(data);
  }
  onSignIn(data) {
    this.#model.signIn(data);
  }
}

class AuthenticationView extends Observer {
  #controller;
  constructor(controller) {
    super();
    this.#controller = controller;
    this.signUpButton = document.getElementById("signUpButton");
    this.signUpButton.onclick = (e) => {
      this.#showSignUpForm();
    };
    this.signInButton = document.getElementById("signInButton");
    this.signInButton.onclick = (e) => {
      this.#showSignInForm();
    };
  }
  onUpdate(state) {
    if (state.error) {
      new ErrorModal(
        "That failed. Maybe try signing up or waiting or finding a new calendar app."
      ).show();
    }
  }
  #showSignInForm() {
    const form = new AuthenticationFormModal(async (d) => {
      this.#controller.onSignIn(d);
    }, false);
    form.show();
  }
  #showSignUpForm() {
    const form = new AuthenticationFormModal(async (d) => {
      this.#controller.onSignUp(d);
    }, true);
    form.show();
  }
}

class Redirecter extends Observer {
  onUpdate(state) {
    if (state.authenticated && !state.error) {
      let searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("from")) {
        // send the user back to wherever they came from
        window.location.href = searchParams.get("from");
      } else {
        // send them to index.html, surely something is there for the user
        window.location.href = "index.html";
      }
    }
  }
}

class AuthenticationFormModal extends Modal {
  constructor(onSubmit, isRegister) {
    super();
    const formArea = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = isRegister ? "Sign Up" : "Sign In";
    const form = document.createElement("form");
    const usernameLabel = document.createElement("label");
    usernameLabel.textContent = "Username";
    const usernameInput = document.createElement("input");
    usernameInput.autocomplete = "username";
    usernameInput.name = "username";
    usernameInput.required = true;
    usernameInput.minLength = 1;
    usernameInput.maxLength = 255;
    usernameLabel.append(usernameInput);

    const passwordLabel = document.createElement("label");
    passwordLabel.textContent = "Password";
    const passwordInput = document.createElement("input");
    passwordInput.autocomplete = isRegister
      ? "new-password"
      : "current-password";
    passwordInput.type = "password";
    passwordInput.name = "password";
    passwordInput.required = true;
    passwordInput.minLength = 1;
    passwordInput.maxLength = 255;
    passwordLabel.append(passwordInput);

    const button = ButtonFactory.createSubmitButton(
      isRegister ? "Sign Up" : "Sign In"
    );
    form.onsubmit = (e) => {
      e.preventDefault(); // so it doesn't try to submit the form
      const data = Object.fromEntries(new FormData(event.target));
      onSubmit(data);

      super.close();
    };
    form.append(usernameLabel, passwordLabel, button);
    super.append(title, form);
  }
}

class AuthenticationStateHelper {
  static create(authenticated) {
    return {
      authenticated,
      error: false,
    };
  }
}

export {
  AuthenticationService,
  AuthenticationModel,
  AuthenticationController,
  AuthenticationView,
  Redirecter,
};
