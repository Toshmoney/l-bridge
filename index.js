const express = require("express");
const app = express();
const port = 4000;
const dotenv = require("dotenv")
const morgan = require("morgan")
const cors = require("cors")
const bodyParser = require("body-parser");
const connectDB = require("./db/connect");


// middlewares
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
app.use(cors())
app.use(morgan("dev"));
dotenv.config();

app.get("/test", (req, res)=>{
    res.json({msg: "Server working perfectly well!"})
})

app.listen(port, async()=>{
    console.log(`server started at http://localhost:${port}`);
    await connectDB();
})
