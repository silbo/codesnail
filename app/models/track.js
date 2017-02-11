'use strict';

/* Load modules */
const mongoose = require('mongoose');

/* Schema objects */
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/* Create track schema */
const TrackSchema = new Schema({
	name: { type: String, unique: true, required: true },
	description: String,
	category: [{ type: ObjectId, ref: 'Course' }]
});

mongoose.model('Track', TrackSchema);
