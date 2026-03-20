const Query = require("../models/Query")

exports.processQuery = async (query) => {

    const savedQuery = await Query.create({ query })

    return {
        query: savedQuery.query,
        processed: true,
        id: savedQuery._id
    }
}