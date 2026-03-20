// exports.handleQuery = (req, res) => {
//     res.json({
//         message: "Query handled by controller"
//     })
// }
const { processQuery } = require("../services/researchService")

exports.handleQuery = async (req, res, next) => {
    try {
        const { query } = req.body

        const result = processQuery(query)

        res.json(result)

    } catch (error) {
        next(error)
    }
}