'use strict';

/* Load modules */
const mongoose = require('mongoose');

/* Schemas objects */
const Schema = mongoose.Schema;

/* Create badge schema */
const BadgeSchema = new Schema({
	name: { type: String, unique: true, required: true },
	image: { type: String, required: true }
});

mongoose.model('Badge', BadgeSchema);
