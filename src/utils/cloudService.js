const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  cloud_name: "amansangani",
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRETKEY,
});

const uploadOnCloud = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File is Uploaded to Cloudinary : " + JSON.stringify(response));

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );

module.exports = { uploadOnCloud };
