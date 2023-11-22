import App from "./server.js"

new App().server.listen(3000, () => {
    console.log("Servidor ligado")
})