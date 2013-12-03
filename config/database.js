/* Add modules */
var config = require("./config"),
	auth = require("./authentication"),
	email = require("./email");

/* Connect to database */
var mongoose = require("mongoose");
var collections = ["users", "reports"];
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

var CourseSchema = new Schema({
	name: { type: String, unique: true, required: true },
	description: String,
	difficulty: String,
	keywords: [{ type: String }],
	levels: [{ task: String, points: Number, badge: { type: ObjectId, ref: 'Badge' } }]
});

var UserSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, unique: true, lowercase: true, trim: true, required: true, validate: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\b/ },
	password: { type: String, required: true, default: "default" },
	verification: {
		verified: { type: Boolean, required: true, default: false }, 
		verification_hash: { type: String, required: true, unique: true, default: "default" }
	},
	profile: {
		joined_date: { type: Date, required: true, default: Date.now },
		points: { type: Number, default: 1 },
		location: { type: String, default: "" },
		mugshot: { type: String, default: "" },
		website: { type: String, default: "" },
		description: { type: String, default: "" },
		providers: [{ type: ObjectId, ref: 'Provider' }],
		badges: [{ type: ObjectId, ref: 'Badge' }],
	},
	courses: [{ progress: Number, course: { type: ObjectId, ref: 'Course' } }]
});

/* Predave for user */
UserSchema.pre('save', function(next) {
	/* When the user logs in with a provider first time */
	if (this.password == "default") {
		/* Send the user his default password */
		this.password = auth.calculateHash("sha1", this.email + new Date());
		email.sendLoginEmail(this.name, this.email, this.password);
		/* Calculate the password hash */
		this.password = auth.calculateHash("sha1", this.password);
		/* Set user as verified */
		this.verification.verified = true;
		this.verification.verification_hash = auth.calculateHash("sha1", this.email + new Date());
	}
	/* When the user registers first time */
	else if (this.verification.verification_hash == "default") {
		/* Calculate the password hash */
		this.password = auth.calculateHash("sha1", this.password);
		/* Calculate the verification hash */
	  this.verification.verification_hash = auth.calculateHash("sha1", this.email + new Date());
	  /* Send the user the verification email */
	  email.sendRegistrationEmail(this.name, this.email, this.verification.verification_hash);
	}
	/* Set the mugshot and website from gravatar */
	this.profile.mugshot = this.profile.mugshot || config.gravatar.mugshot + auth.calculateHash("md5", this.email) + "?d=identicon";
	this.profile.website = this.profile.website || config.gravatar.profile + auth.calculateHash("md5", this.email);
  next();
});

/* Database objects */
exports.Badge = mongoose.model("Badge", BadgeSchema);
exports.Provider = mongoose.model("Provider", ProviderSchema);
exports.Course = mongoose.model("Course", CourseSchema);
exports.User = mongoose.model("User", UserSchema);