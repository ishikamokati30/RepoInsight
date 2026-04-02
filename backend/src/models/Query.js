const mongoose = require("mongoose")

const querySchema = new mongoose.Schema({
    query: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],  
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Query", querySchema)