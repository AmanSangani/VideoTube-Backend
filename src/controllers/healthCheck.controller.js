const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");

const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, {}, "system is working fine"));
});

module.exports = { healthCheck };
