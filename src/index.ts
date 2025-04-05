import { Request, Response } from "express";

const express = require("express");
const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world 👋");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
