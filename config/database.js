/* Configuration */
var config = require("./config");

/* Connect to database */
console.log("INFO", "connecting to database on:", config.database_url);
var mongoose = require("mongoose");
var collections = ["users", "reports"];
mongoose.connect(config.database_url, collections);

var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

/* Database schemas */
var UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  verified: { type: Boolean, required: true },
  verification_hash: { type: String, required: true, unique: true },
  providers: [{ name: String, mugshot_src: String, profile_name: String, profile_url: String }],
  badges: [{ name: String, date: Date }]
});
var BadgeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, required: true },
});

/* Database objects */
exports.User = mongoose.model("User", UserSchema);
exports.Badge = mongoose.model("Badge", BadgeSchema);