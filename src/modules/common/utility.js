class IdentifierUtility {
    static generateRandomId() {
        return Math.floor((Math.random() * 10000000000) + 1);
    }
}

class Observer {
    constructor() {
    }
    onUpdate(state) {
        throw 'onUpdate must be implemented by ' + this;
    }
}

class AbstractState {
    asData() {
        return JSON.parse(JSON.stringify(this));
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
    notifyAll(state) {
        this.#observers.forEach(observer => observer.onUpdate(state.asData()));
    }
}

export {IdentifierUtility, Observer, AbstractState, Observable}