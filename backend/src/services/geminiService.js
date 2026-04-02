const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

exports.generateAnswer = async (query, context) => {
  try {
    const prompt = `
You are a technical AI assistant.

Context:
${context}

Question:
${query}

Give a clear, structured answer.
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    return response.text

  } catch (error) {
    console.error("Gemini Error:", error.message)
    throw error
  }
}