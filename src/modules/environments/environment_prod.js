const environment = Promise.resolve({
    "rootUrl": "http://localhost:8080",
    "tokenKey": "token",
    "name": "PROD",
    "storageSolution": "ls"
})
export default await environment;