const axios = require("axios")
const Query = require("../models/Query")

exports.processQuery = async (query) => {
    try {

        const response = await axios.post(
            "http://127.0.0.1:8000/embed",
            { text: query }
        )

        const embedding = response.data.embedding
        const savedQuery = await Query.create({
            query,
            embedding
        })

        return {
            query,
            processed: true,
            id: savedQuery._id
        }

    } catch (error) {
        console.error("ML Service Error:", error.message)
        throw error
    }
}