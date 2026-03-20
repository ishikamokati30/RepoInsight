const { body, validationResult } = require("express-validator")

const validateQuery = [
    body("query")
        .notEmpty().withMessage("Query is required")
        .isLength({ min: 3 }).withMessage("Minimum 3 chars"),

    (req, res, next) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        next()
    }
]

module.exports = validateQuery