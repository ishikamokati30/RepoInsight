const express = require("express")
const router = express.Router()

const { handleQuery, searchQuery } = require("../controllers/researchController")

const validateQuery = require("../middlewares/validateQuery")

const { getRecommendations } = require("../controllers/researchController")

router.post("/recommend", getRecommendations)
router.post("/query", validateQuery, handleQuery)
router.post("/search", validateQuery, searchQuery)

module.exports = router
