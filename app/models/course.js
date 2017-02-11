'use strict';

/* Load modules */
const mongoose = require('mongoose');

/* Schema objects */
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/* Create course schema */
const CourseSchema = new Schema({
	name: { type: String, unique: true, required: true },
	description: String,
	difficulty: String,
	keywords: [{ type: String }],
	tasks: [{ type: ObjectId, ref: 'Task' }],
	badge: { type: ObjectId, ref: 'Badge' }
});

mongoose.model('Course', CourseSchema);
