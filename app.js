const express = require('express');
const { dirname } = require('path');
const path = require('path');
const app = express();

const port = 8080;
app.use(express.static(path.join(__dirname,"/")))
app.get("/", (req,res) => {
   res.sendFile(path.join(__dirname, "/index.html"));
})
app.get("/data/coins.json", (req,res) => {
   res.sendFile(path.join(__dirname, "/data/coins.json"));
})
app.get("/data/data.json", (req,res) => {
   res.sendFile(path.join(__dirname, "/data/data.json"));
})
app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
 })


 



