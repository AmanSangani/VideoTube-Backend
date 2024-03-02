const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const { ApiError } = require("./ApiError");

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

const getDetailsOfCloudImage = async (fileURL) => {
  console.log("Fetching details for image:", fileURL);
  try {
    const publicIdentifier = fileURL.match(/\/([^\/]+)$/)[1].split(".")[0];
    const result = await cloudinary.api.resource(publicIdentifier);
    console.log("Image details:", result);
  } catch (error) {
    console.error("Error fetching image details:", error.message || error);
  }
};

const deleteFileOnCloud = async (fileURL) => {
  try {
    if (!fileURL) {
      console.log("FilePathToBeDelete is required");
      return null;
    }
    const publicIdentifier = fileURL.match(/\/([^\/]+)$/)[1].split(".")[0];
    const responce = await cloudinary.uploader.destroy(publicIdentifier);
    console.warn(responce);
    console.log("Public Identifier:", publicIdentifier);

    console.log(responce);
    return responce;
  } catch (error) {
    return null;
  }
};

module.exports = { uploadOnCloud, deleteFileOnCloud, getDetailsOfCloudImage };
