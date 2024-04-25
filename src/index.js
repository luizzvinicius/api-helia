import App from "./server.js"

new App().server.listen(3001, () => {
    console.log("Servidor ligado")
})