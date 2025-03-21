const mongoose =require ("mongoose")
const dotenv =require ("dotenv")

dotenv.config();

const connectMongodb = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("Connected to MongoDB...");
    } catch (err) {
      console.log("Error connecting to MongoDB", err.message);
    }
};

module.exports= connectMongodb;