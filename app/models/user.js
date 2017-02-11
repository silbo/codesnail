'use strict';

/* Load modules */
const mongoose = require('mongoose');

/* Schema objects */
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/* Create user schema */
const UserSchema = new Schema({
	name: { type: String, required: true },
	password: { type: String, default: '' },
	username: { type: String, unique: true, required: true, validate: /^[a-z0-9_-]{4,15}$/ },
	email: { type: String, unique: true, lowercase: true, trim: true, required: true, validate: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}\b/ },
	verification: {
		verification_hash: { type: String },
		verified: { type: Boolean, required: true, default: false }
	},
	profile: {
		points: { type: Number, default: 0 },
		mugshot: { type: String, default: '' },
		website: { type: String, default: '' },
		location: { type: String, default: '' },
		description: { type: String, default: '' },
		badges: [{ type: ObjectId, ref: 'Badge' }],
		tracks: [{ type: ObjectId, ref: 'Track' }],
		joined_date: { type: Date, required: true },
		providers: [{ type: ObjectId, ref: 'Provider' }],
	},
});

mongoose.model('User', UserSchema);
