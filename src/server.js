import "express-async-errors";
import express from "express";
import router from "./routes/router.js";

export default class App {
  constructor() {
    this.server = express();
    this.middleware();
    this.router();
  }

  middleware() {
    this.server.use(express.json());
    this.server.use((error, req, res, next) => {
      return res.status(500).json({ details: error.message });
    });
  }

  router() {
    this.server.use(router);
  }
}