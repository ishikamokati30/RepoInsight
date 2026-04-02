const { processQuery } = require("../services/researchService")
const Query = require("../models/Query")
const axios = require("axios")

exports.handleQuery = async (req, res, next) => {
    try {
        const { query } = req.body

        const result = await processQuery(query)

        return res.status(200).json(result)

    } catch (error) {
        next(error)
    }
}
exports.getRecommendations = async (req, res) => {
    return res.status(200).json({
        message: "Recommendations feature coming soon"
    })
}
exports.searchQuery = async (req, res, next) => {
    try {
        const { query } = req.body

        const allData = await Query.find()

        const validData = allData.filter(item => item.embedding && item.embedding.length > 0)

const texts = [...new Set(validData.map(item => item.query))]
const embeddings = validData.map(item => item.embedding)

console.log("Texts:", texts.length)
console.log("Embeddings:", embeddings.length)

if (embeddings.length === 0) {
    return res.status(200).json({ results: [] })
}

        const response = await axios.post(
            "http://127.0.0.1:8000/search-from-db",
            {
                query,
                texts,
                embeddings
            }
        )

        return res.status(200).json(response.data)

    } catch (error) {
        console.error(error.message)
        next(error)
    }
}
const { askAI } = require("../services/researchService")

exports.askQuestion = async (req, res, next) => {
    try {
        const { query } = req.body
        const result = await askAI(query)
        res.json(result)
    } catch (err) {
        next(err)
    }
}