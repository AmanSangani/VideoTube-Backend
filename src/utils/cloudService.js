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

const getDetailsOfCloudImage = async (imageUrl) => {
  console.log("Fetching details for image:", imageUrl);
  try {
    const result = await cloudinary.api.resource(imageUrl);
    console.log("Image details:", result);
  } catch (error) {
    console.error("Error fetching image details:", error.message || error);
  }
};

const deleteFileOnCloud = async (filePathToBeDelete) => {
  try {
    if (!filePathToBeDelete) {
      console.log("FilePathToBeDelete is required");
      return null;
    }
    const responce = await cloudinary.uploader.destroy(filePathToBeDelete);
    console.log(responce);
    return responce;
  } catch (error) {
    return null;
  }
};

module.exports = { uploadOnCloud, deleteFileOnCloud, getDetailsOfCloudImage };
