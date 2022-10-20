const environment = Promise.resolve({
    "rootUrl": "http://localhost:8080",
    "tokenKey": "token",
    "name": "LOCAL",
    "storageSolution": "ls"
})
export default await environment;