const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const cors = require('cors');

require("dotenv").config();
const PORT = process.env.PORT;

const app = express();
const router = express.Router();

//Routers
const coursesRouter = require("./routes/courses");
const lessonsRouter = require("./routes/lessons");
const videoRouter = require("./routes/video");
const scanRouter = require("./routes/scan");

//Serve static files
app.use(express.static('assets'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cors());

app.use("/", router);
app.use("/scan", scanRouter);
app.use("/courses", coursesRouter);
app.use("/lessons", lessonsRouter);
app.use("/video", videoRouter);

//Conntect to MongoDB with strictQuery setting to false
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/Udefin')
  .then(() => {
    console.log("🚀 Connected to MongoDB!");
  })
  .catch(err => {
    console.log("❌ Error connecting to MongoDB!");
    console.log(err);
  });

//App
app.get('/', (req, res) => {
  res.redirect("/courses");
});

app.listen(PORT, () => {
  console.log(`Udefin app listening at http://localhost:${PORT}`)
});