/**
 * Simple http server for serving the .mp4 file
 */
"use strict";

const path = require("path");
const express = require("express");

const app = express();

const publicPath = path.join(__dirname, "../basic");

app.use(express.static(publicPath));

app.listen(3000, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Listening on port 3000");
});
