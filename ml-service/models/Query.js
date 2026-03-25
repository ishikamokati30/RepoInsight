const mongoose = require("mongoose")

const querySchema = new mongoose.Schema({
    query: String,
    embedding: [Number], // NEW
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Query", querySchema)