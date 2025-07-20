
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js"

dotenv.config();

const PORT = process.env.PORT || 5000;

// --- MongoDB Connection ---
// connect to db
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB || "")
  .then(() => {
    // listen for requests
    app.listen(PORT, () => {
      console.log(`connected to db & listening on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.log(err, "the mongodb string is not correct");
  });
