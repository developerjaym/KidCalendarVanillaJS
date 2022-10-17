class IdentifierUtility {
  static generateRandomId() {
    return Math.floor(Math.random() * 10000000000 + 1);
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
    this.#observers.forEach((observer) => observer.onUpdate(event));
  }
}

export { IdentifierUtility, Observer, Observable };
