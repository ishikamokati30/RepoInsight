const axios = require("axios")
const Query = require("../models/Query")
const { generateAnswer } = require("./geminiService")

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

exports.askAI = async (query) => {

    const allData = await Query.find()

    const validData = allData.filter(item => item.embedding && item.embedding.length > 0)

    const texts = validData.map(item => item.query)
    const embeddings = validData.map(item => item.embedding)

    // 🔍 Step 1: semantic search
    const searchRes = await axios.post(
        "http://127.0.0.1:8000/search-from-db",
        { query, texts, embeddings }
    )

    const context = searchRes.data.results.join("\n")

    // 🤖 Step 2: Gemini answer
    const answer = await generateAnswer(query, context)

    return {
        answer,
        context
    }
}
