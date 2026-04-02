require("dotenv").config({ path: "../.env" })
const express = require("express")
const cors = require("cors")


const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

console.log("MONGO_URI:", process.env.MONGO_URI)
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
