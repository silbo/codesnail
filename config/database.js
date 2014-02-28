/* Add modules */
var utils = require('./utils'),
	config = require('./config'),
	emailing = require('./email');

/* Connect to database */
var mongoose = require("mongoose");
var collections = ["users", "providers", "courses", "badges"];
console.log("INFO", "connecting to database on:", config.database_url);
mongoose.connect(config.database_url, collections);
/* Debug mode */
mongoose.set('debug', true);

var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

/* Database schemas */
var BadgeSchema = new Schema({
	name: { type: String, unique: true, required: true },
	image: { type: String, required: true }
});

var ProviderSchema = new Schema({
	name: { type: String, required: true },
	mugshot: String,
	display_name: String,
	url: String
});

var TaskSchema = new Schema({
	name: { type: String, unique: true, required: true },
	description: String,
	verification: String,
	points: { type: Number, required: true, default: 0 },
	badge: { type: ObjectId, ref: 'Badge' }
});

var CourseSchema = new Schema({
	name: { type: String, unique: true, required: true },
	description: String,
	difficulty: String,
	keywords: [{ type: String }],
	tasks: [{ type: ObjectId, ref: 'Task' }],
	badge: { type: ObjectId, ref: 'Badge' }
});

var TrackSchema = new Schema({
	name: { type: String, unique: true, required: true },
	description: String,
	category: [{ type: ObjectId, ref: 'Course' }]
});

var UserSchema = new Schema({
	username: { type: String, unique: true, required: true, validate: /^[a-z0-9_-]{4,15}$/ },
	name: { type: String, required: true },
	email: { type: String, unique: true, lowercase: true, trim: true, required: true, validate: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}\b/ },
	password: { type: String, default: "" },
	verification: {
		verified: { type: Boolean, required: true, default: false },
		verification_hash: { type: String, default: "" }
	},
	profile: {
		joined_date: { type: Date, required: true, default: Date.now },
		points: { type: Number, default: 0 },
		mugshot: { type: String, default: "" },
		website: { type: String, default: "" },
		location: { type: String, default: "" },
		description: { type: String, default: "" },
		badges: [{ type: ObjectId, ref: 'Badge' }],
		providers: [{ type: ObjectId, ref: 'Provider' }],
	},
	tracks: [{ type: ObjectId, ref: 'Track' }]
});

/* Database objects */
exports.Badge = mongoose.model("Badge", BadgeSchema);
exports.Provider = mongoose.model("Provider", ProviderSchema);
exports.Task = mongoose.model("Task", TaskSchema);
exports.Course = mongoose.model("Course", CourseSchema);
exports.Track = mongoose.model("Track", TrackSchema);
exports.User = mongoose.model("User", UserSchema);