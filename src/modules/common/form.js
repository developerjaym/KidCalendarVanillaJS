import { ButtonFactory, RadioFactory, SelectFactory } from "./ui.js";
import { IdentifierUtility } from "./utility.js";

export class FormFieldType {
  static #DATE = "date";
  static #TEXT = "text";
  static #PASSWORD = "password";
  static #SELECT = "select";
  static #RADIO = "radio";

  static get DATE() {
    return FormFieldType.#DATE;
  }
  static get TEXT() {
    return FormFieldType.#TEXT;
  }
  static get PASSWORD() {
    return FormFieldType.#PASSWORD;
  }
  static get SELECT() {
    return FormFieldType.#SELECT;
  }
  static get RADIO() {
    return FormFieldType.#RADIO;
  }
}

export class FormFieldBuilder {
  #container;
  #type;
  #options;
  #name;
  #required;
  #min;
  #max;
  #minLength;
  #maxLength;
  #value;
  #label;
  #autocomplete;
  #selectClasses;
  #optionClasses;
  constructor(obj = {}) {
    this.#container = document.createElement("label");
    this.#type = FormFieldType.TEXT;
    ({
      label: this.#label,
      type: this.#type = FormFieldType.TEXT,
      options: this.#options,
      name: this.#name,
      autocomplete: this.#autocomplete = "",
      required: this.#required = false,
      min: this.#min = -99999,
      max: this.#max = 99999,
      minLength: this.#minLength = 0,
      maxLength: this.#maxLength = 99999,
      value: this.#value = "",
      selectClasses: this.#selectClasses = [],
      optionClasses: this.#optionClasses = [],
    } = obj);
  }

  ofType(type) {
    this.#type = type;
    return this;
  }

  withOptions(...options) {
    this.#options = options;
    return this;
  }

  withOptionClasses(...optionClasses) {
    this.#optionClasses = optionClasses;
  }

  withSelectClasses(...selectClasses) {
    this.#selectClasses = selectClasses;
  }

  withName(name) {
    this.#name = name;
    return this;
  }

  withautocomplete(autocomplete) {
    this.#autocomplete = autocomplete;
  }

  withLabel(text) {
    this.#label = text;
    return this;
  }

  required() {
    this.#required = true;
    return this;
  }

  length(min, max) {
    this.#minLength = min;
    this.#maxLength = max ?? min;
    return this;
  }

  minmax(min, max) {
    this.#min = min;
    this.#max = max;
    return this;
  }

  value(value) {
    this.#value = value;
    return this;
  }

  build() {
    let input;
    switch (this.#type) {
      case FormFieldType.SELECT:
        input = SelectFactory.createSelect(
          this.#name,
          this.#options,
          this.#value,
          this.#optionClasses ?? [],
          this.#selectClasses ?? []
        );
        break;
      case FormFieldType.RADIO:
        input = RadioFactory.createRadioGroup(
          this.#name,
          this.#options,
          this.#value
        );
        break;
      default:
        input = document.createElement("input");
        input.required = this.#required;
        input.type = this.#type;
        input.name = this.#name;
        input.value = this.#value;
        input.minLength = this.#minLength;
        input.maxLength = this.#maxLength;
        input.min = this.#min;
        input.max = this.#max;
        if (this.#autocomplete) {
          input.autocomplete = this.#autocomplete;
        }
        if (this.#options) {
          const datalist = document.createElement("datalist");
          datalist.id = input.name || IdentifierUtility.generateRandomId();
          input.list = datalist.id;
          this.#options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
          });
          this.#container.appendChild(datalist);
        }
        break;
    }
    this.#container.textContent = this.#label;
    this.#container.appendChild(input);
    return this.#container;
  }

  static quickBuild(configObject) {
    return new FormFieldBuilder(configObject).build();
  }
}

export class FormBuilder {
  #element;
  #inputs;
  #buttonText;
  constructor() {
    this.#element = document.createElement("form");
    this.#inputs = [];
  }
  withFields(...fields) {
    this.#inputs.push(...fields);
    return this;
  }
  buttonText(buttonText) {
    this.#buttonText = buttonText;
    return this;
  }
  onSubmit(onSubmit) {
    this.#element.onsubmit = (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target));
      onSubmit(formData);
    };
    return this;
  }
  build() {
    this.#element.append(
      ...this.#inputs,
      ButtonFactory.createSubmitButton(this.#buttonText)
    );
    return this.#element;
  }
  static quickBuild(onSubmit, buttonText, ...configObjects) {
    return new FormBuilder()
      .withFields(...configObjects.map(FormFieldBuilder.quickBuild))
      .buttonText(buttonText)
      .onSubmit(onSubmit)
      .build();
  }
}
