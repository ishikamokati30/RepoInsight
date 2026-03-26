const express = require("express")
const router = express.Router()

const { handleQuery } = require("../controllers/researchController")

const validateQuery = require("../middlewares/validateQuery")

router.post("/query", validateQuery, handleQuery)

module.exports = router