import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import formidable from "formidable";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const app = express();

//connection with MongoDB
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true })
  .then((res) => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

//schema
const userSchema = new mongoose.Schema({
  certification: {
    type: String,
    trim: true,
    required: true,
  },
  issuer: {
    type: String,
    trim: true,
    required: true,
  },
  image: {
    data: Buffer,
    contentType: String,
    fileName: String,
    path: String,
  },
});

const User = mongoose.model("User", userSchema);

//middleware
app.use(bodyParser.json());
app.use(cors());

const userData = (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, file) => {
    console.log(file);
    if (fields) {
      const { certification, issuer } = fields;
      if (!certification || !issuer) {
        return res.status(400).json({
          error: "Fill all the fields",
        });
      }
    }
    if (file.image) {
      if (file.image.size > 4000000) {
        return res.status(400).json({
          error: "file size is too long",
        });
      }
      const user = new User(fields);
      user.image.data = fs.readFileSync(file.image.filepath);
      user.image.contentType = file.image.mimetype;
      user.image.fileName = file.image.originalFilename;
      user.image.path = file.image.filepath;

      user.save((err, user) => {
        if (err) {
          return res.status(400).json({
            error: "Not save in DB",
          });
        }
        return res.json(user);
      });
    }
  });
};

const getDetail = async (req, res) => {
  try {
    const detail = await User.find({});

    res.send(detail);
  } catch (error) {
    res.json({ message: error });
  }
};

//Routes
app.get("/", (req, res) => {
  res.send("NodeApp is Running");
});

app.post("/userDetail", userData);

app.get("/getDetail", getDetail);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server is Running");
});
