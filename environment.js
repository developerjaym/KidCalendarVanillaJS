class Environment {
    static DEV = new Environment("http://localhost:8080")
    constructor(rootUrl) {
        this.rootUrl = rootUrl;
        this.tokenKey = "token";
    }
}