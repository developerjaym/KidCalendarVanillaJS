class IdentifierUtility {
  static generateRandomId() {
    return crypto.randomUUID();
  }
}

class ArrayUtility {
  static removeIf(arr, test) {
    let index = arr.findIndex(test);
    while(index !== -1) {
      arr.splice(index, 1);
      index = arr.findIndex(test);
    }
  }
}

class Observer {
  constructor() {}
  onUpdate(state) {
    throw "onUpdate must be implemented by " + this;
  }
}

class Observable {
  #observers;
  constructor() {
    this.#observers = [];
  }
  addObserver(observer) {
    this.#observers.push(observer);
  }
  notifyAll(event) {
    this.#observers.forEach((observer) => observer.onUpdate(structuredClone(event)));
  }
}

export { IdentifierUtility, Observer, Observable, ArrayUtility };
