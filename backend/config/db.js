import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://azruddinkhan952062_db_user:F5Id26Yd9jtqJT64@cluster0.20vctbo.mongodb.net/MediCare")
    .then(() => {
        console.log("DB CONNECTED")
    })
}