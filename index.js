const express = require("express");
const app = express();
const port = 4000;
const dotenv = require("dotenv")
const morgan = require("morgan")
const cors = require("cors")
const bodyParser = require("body-parser");
const connectDB = require("./db/connect");
const authRoutes = require("./routes/authRoutes");
const templateRoutes = require("./routes/templateRoutes");
const documentRoutes = require("./routes/documentRoutes");
const customTemplateRoutes = require("./routes/customTemplateRoutes");
const lawyerRoutes = require("./routes/lawyerRoutes");
const consultationRoutes = require("./routes/consultation");
const purchaseRoutes = require("./routes/purchaseRoute");
const walletRoutes = require("./routes/walletRoutes");



// middlewares
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
app.use(cors("*"));

app.use(morgan("dev"));
dotenv.config();

app.get("/test", (req, res)=>{
    res.json({msg: "Server working perfectly well!"})
})


// routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/custom-templates", customTemplateRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", walletRoutes);


app.listen(port, async()=>{
    console.log(`server started at http://localhost:${port}`);
    await connectDB();
})
