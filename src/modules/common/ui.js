class Modal {
  #container;
  #modal;
  constructor() {
    this.#container = document.createElement("div");
    this.#container.classList.add("modal-container");
    this.#modal = document.createElement("div");
    this.#modal.classList.add("modal");
    this.#modal.onclick = (e) => e.stopPropagation();

    this.#container.append(this.#modal);
    this.#container.onclick = (e) => this.close();
  }
  append(...innerElements) {
    this.#modal.append(...innerElements);
  }
  show() {
    document.getElementById("app").append(this.#container);
    UIAnimation.createAppearingAnimation(this.#modal);
  }
  close() {
    UIAnimation.createDisappearingAnimation(this.#modal, this.#container);
  }
}

class Toast {
  #toastElement;
  static #CLOSING_TIME = 3000;
  constructor() {
    this.#toastElement = document.createElement("div");
    this.#toastElement.classList.add("toast");
  }
  static show(text) {
    const toast = new Toast();
    const label = document.createElement("label");
    label.textContent = text;
    toast.#append(label);
    toast.#show();
  }
  #append(...innerElements) {
    this.#toastElement.append(...innerElements);
  }
  #show() {
    document.getElementById("app").append(this.#toastElement);
    UIAnimation.createAppearingAnimation(this.#toastElement);
    window.setTimeout(() => this.#toastElement.remove(), Toast.#CLOSING_TIME);
  }
}

class ButtonTypes {
  static ICON = ["button", "button-icon"];
  static SUBMIT = ["button", "button-submit"];
}
class Icons {
  static #DELETE = "⌫";
  static #ADD = "➕";
  static #SCHOOL = "🏫";
  static #PLANE = "🛫";
  static #SHIP = "🛳";
  static #WEDDING = "⛪";
  static #HOSPITAL = "🏥";
  static #DANCE = "💃";
  static #LIBRARY = "📚";
  static #MUSIC = "🎼";
  static #STAR = "★";
  static #OLD_WOMAN = "👵";
  static #HAMBURGER = "🍔";
  static #BAGEL = "🥯";
  static #CITY = "🏙";
  static #CAR = "🚗";
  static #TOY = "🧸";
  static #CAROUSEL = "🎠";
  static #EMPTY = "";
  static get DELETE() {
    return Icons.#DELETE;
  }
  static get ADD() {
    return Icons.#ADD;
  }
  static get SCHOOL() {
    return Icons.#SCHOOL;
  }
  static get PLANE() {
    return Icons.#PLANE;
  }
  static get SHIP() {
    return Icons.#SHIP;
  }
  static get WEDDING() {
    return Icons.#WEDDING;
  }
  static get HOSPITAL() {
    return Icons.#HOSPITAL;
  }
  static get DANCE() {
    return Icons.#DANCE;
  }
  static get LIBRARY() {
    return Icons.#LIBRARY;
  }
  static get MUSIC() {
    return Icons.#MUSIC;
  }
  static get STAR() {
    return Icons.#STAR;
  }
  static get OLD_WOMAN() {
    return Icons.#OLD_WOMAN;
  }
  static get HAMBURGER() {
    return Icons.#HAMBURGER;
  }
  static get BAGEL() {
    return Icons.#BAGEL;
  }
  static get CITY() {
    return Icons.#CITY;
  }
  static get CAR() {
    return Icons.#CAR;
  }
  static get TOY() {
    return Icons.#TOY;
  }
  static get CAROUSEL() {
    return Icons.#CAROUSEL;
  }
  static get EMPTY() {
    return Icons.#EMPTY;
  }
  static get ALL() {
    return [
      Icons.EMPTY,
      Icons.STAR,
      Icons.ADD,
      Icons.BAGEL,
      Icons.HAMBURGER,
      Icons.OLD_WOMAN,
      Icons.SCHOOL,
      Icons.TOY,
      Icons.CAROUSEL,
      Icons.PLANE,
      Icons.SHIP,
      Icons.CAR,
      Icons.CITY,
      Icons.WEDDING,
      Icons.HOSPITAL,
      Icons.DANCE,
      Icons.LIBRARY,
      Icons.MUSIC,
    ];
  }
}

class ButtonFactory {
  static createIconButton(icon, backgroundColor = Colors.TRANSPARENT) {
    const buttonElement = document.createElement("button");
    buttonElement.textContent = icon;
    buttonElement.classList.add(...ButtonTypes.ICON);
    buttonElement.style.backgroundColor = backgroundColor;
    return buttonElement;
  }
  static createSubmitButton(text = "submit", icon = Icons.EMPTY) {
    const buttonElement = document.createElement("button");
    buttonElement.classList.add(...ButtonTypes.SUBMIT);
    buttonElement.textContent = icon + text;
    return buttonElement;
  }
}

class SelectFactory {
  static createSelect(
    elementName,
    options,
    selectedOption,
    optionClasses = [],
    selectClasses = []
  ) {
    const select = document.createElement("select");
    select.classList.add(...selectClasses);
    select.name = elementName;
    for (let option of options) {
      const optionElement = document.createElement("option");
      optionElement.classList.add(...optionClasses);
      optionElement.textContent = option;
      optionElement.selected = option === selectedOption;
      select.append(optionElement);
    }
    return select;
  }
}

class RadioFactory {
  static createRadioGroup(groupName, options, selectedOption) {
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("radio-group-buttons");
    for (let option of options) {
      const labelContainer = document.createElement("label");
      labelContainer.textContent = option;
      const radioButton = document.createElement("input");
      radioButton.type = "radio";
      radioButton.name = groupName;
      radioButton.value = option;
      radioButton.checked = option === selectedOption;
      labelContainer.appendChild(radioButton);
      buttonContainer.append(labelContainer);
    }
    return buttonContainer;
  }
}

class AnimationDuration {
  static get SHORT() {
    return 444;
  }
  static get LONG() {
    return 1111;
  }
}
class AnimationClasses {
  static #DISAPPEAR_SHORT = "disappear-short";
  static #APPEAR_SHORT = "appear-short";
  static get DISAPPEAR_SHORT() {
    return AnimationClasses.#DISAPPEAR_SHORT;
  }
  static get APPEAR_SHORT() {
    return AnimationClasses.#APPEAR_SHORT;
  }
}
class UIAnimation {
  static DISAPPEAR = new UIAnimation(
    AnimationClasses.DISAPPEAR_SHORT,
    AnimationDuration.SHORT
  );
  static APPEAR = new UIAnimation(
    AnimationClasses.APPEAR_SHORT,
    AnimationDuration.SHORT
  );
  constructor(className, time) {
    this.className = className;
    this.time = time;
  }
  static createDisappearingAnimation(element, ...additionalElementsToRemove) {
    const animation = UIAnimation.DISAPPEAR;
    element.classList.remove(UIAnimation.APPEAR.className);
    element.classList.add(animation.className);
    window.setTimeout(() => {
      element.remove();
      additionalElementsToRemove.forEach((e) => e.remove());
    }, animation.time);
  }
  static createAppearingAnimation(element) {
    const animation = UIAnimation.APPEAR;
    element.classList.add(animation.className);
  }
}

class Colors {
  static #YELLOW = "yellow";
  static #RED = "firebrick";
  static #GREENYELLOW = "greenyellow";
  static #PINK = "pink";
  static #PURPLE = "purple";
  static #ORCHID = "orchid";
  static #GOLDENROD = "goldenrod";
  static #TRANSPARENT = "transparent";
  static #WEEKDAY = Colors.YELLOW;
  static #WEEKEND = Colors.PURPLE;
  static #WARNING_BG = Colors.RED;
  static get ALL() {
    return [
      Colors.GOLDENROD,
      Colors.ORCHID,
      Colors.YELLOW,
      Colors.GREENYELLOW,
      Colors.PINK,
      Colors.RED,
      Colors.PURPLE,
      Colors.TRANSPARENT,
    ].sort();
  }
  static get YELLOW() {
    return Colors.#YELLOW;
  }
  static get RED() {
    return Colors.#RED;
  }
  static get GREENYELLOW() {
    return Colors.#GREENYELLOW;
  }
  static get PINK() {
    return Colors.#PINK;
  }
  static get PURPLE() {
    return Colors.#PURPLE;
  }
  static get ORCHID() {
    return Colors.#ORCHID;
  }
  static get GOLDENROD() {
    return Colors.#GOLDENROD;
  }
  static get TRANSPARENT() {
    return Colors.#TRANSPARENT;
  }
  static get WEEKDAY() {
    return Colors.#YELLOW;
  }
  static get WEEKEND() {
    return Colors.#PURPLE;
  }
  static get WARNING_BG() {
    return Colors.#RED;
  }
}

class ErrorModal extends Modal {
  constructor(text) {
    super();
    const title = document.createElement("h2");
    title.textContent = "Oh no!";
    const message = document.createElement("p");
    message.textContent = text;

    const button = ButtonFactory.createSubmitButton("Ok");
    button.onclick = (e) => {
      this.close();
    };
    super.append(title, message, button);
  }
}

export {
  Toast,
  Modal,
  ErrorModal,
  Colors,
  UIAnimation,
  ButtonFactory,
  Icons,
  RadioFactory,
  SelectFactory,
};
