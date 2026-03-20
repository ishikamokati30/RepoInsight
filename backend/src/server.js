const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

const logger = require("./middlewares/logger")
app.use(logger)

const researchRoutes = require("./routes/researchRoutes")

app.use("/api/research", researchRoutes)

app.get("/", (req, res) => {
    res.send("🚀 IntelliResearch Backend Running")
})


const errorHandler = require("./middlewares/errorHandler")
app.use(errorHandler)

const connectDB = require("./config/db")
connectDB()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
