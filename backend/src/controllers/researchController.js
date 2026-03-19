// exports.handleQuery = (req, res) => {
//     res.json({
//         message: "Query handled by controller"
//     })
// }
const { processQuery } = require("../services/researchService")

exports.handleQuery = (req, res) => {
    const { query } = req.body

    const result = processQuery(query)

    res.json(result)
}