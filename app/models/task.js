'use strict';

/* Load modules */
const mongoose = require('mongoose');

/* Schema objects */
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/* Create task schema */
const TaskSchema = new Schema({
	name: { type: String, unique: true, required: true },
    initial: String,
	description: String,
	verification: String,
	points: { type: Number, required: true, default: 0 },
	badge: { type: ObjectId, ref: 'Badge' }
});

mongoose.model('Task', TaskSchema);
