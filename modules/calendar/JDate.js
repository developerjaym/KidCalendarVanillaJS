export default class JDate {
    #jsDate;
    constructor(jsDate) {
        this.#jsDate = jsDate;
    }

    next() {

    }

    toString() {
        return `${this.#jsDate.getFullYear()}-${this.#jsDate.getMonth() + 1}-${this.#jsDate.getDate()}`;
    }

    static today() {
        return new JDate(new Date());
    }
}