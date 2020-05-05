const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");

const PORT = 4000;
const api = require("./route/api");
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api", api);

app.listen(PORT, function () {
  console.log("Running Server on localhost: " + PORT);
});
