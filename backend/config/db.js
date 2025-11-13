import mongoose from "mongoose";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";

const connectDb = async () => {
  const mongoUri =
    process.env.MONGODB_URL ||
    "mongodb+srv://rvprasad24790_db_user:ZiLWIMlk0bVyo66R@mangodb.du5iizp.mongodb.net/foodway?retryWrites=true&w=majority";

  try {
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,              // ⏩ speeds up by limiting connections
      minPoolSize: 5,               // keeps some connections ready
      connectTimeoutMS: 10000,      // fail fast if cannot connect
      socketTimeoutMS: 45000,       // prevents long socket waits
      serverSelectionTimeoutMS: 10000, // avoid infinite waiting
      family: 4,                    // use IPv4 (faster on many ISPs)
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // 🧩 Seed superadmin if missing
    const existingAdmin = await User.findOne({ email: "superadmin@foodway.com" });
    if (!existingAdmin) {
      const bcrypt = (await import("bcryptjs")).default;
      const admin = new User({
        fullName: "Super Admin",
        email: "superadmin@foodway.com",
        password: await bcrypt.hash("superadmin123", 10),
        mobile: "9999999999",
        role: "superadmin",
        isApproved: true,
      });
      await admin.save();
      console.log("🧑‍💼 Seeded superadmin: superadmin@foodway.com / superadmin123");
    }

    // 🍽️ Seed default categories if empty
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
      await Category.create([
        { name: "Snacks", description: "Light snacks and appetizers" },
        { name: "Main Course", description: "Full meals and main dishes" },
        { name: "Desserts", description: "Sweet treats and desserts" },
        { name: "Beverages", description: "Drinks and refreshments" },
      ]);
      console.log("🍴 Seeded basic categories");
    }
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Stop app if DB connection fails
  }
};

export default connectDb;
