// exports.handleQuery = (req, res) => {
//     res.json({
//         message: "Query handled by controller"
//     })
// }
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

exports.searchQuery = async (req, res, next) => {
    try {
        const { query } = req.body
        const allData = await Query.find()

        const texts = allData.map(item => item.query)
        const embeddings = allData.map(item => item.embedding)

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
        if (error.response) {
            return res.status(error.response.status || 502).json({
                message: "Downstream search service error",
                error: error.response.data?.detail || error.response.data?.message || error.message,
                details: error.response.data
            })
        }

        if (error.request) {
            return res.status(503).json({
                message: "Search service unavailable",
                error: "No response received from downstream search service"
            })
        }

        next(error)
    }
}
