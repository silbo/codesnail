'use strict';

/* Load modules */
const mongoose = require('mongoose');

/* Schema objects */
const Schema = mongoose.Schema;

/* Create provider schema */
const ProviderSchema = new Schema({
	name: { type: String, required: true },
	mugshot: String,
	display_name: String,
	url: String
});

mongoose.model('Provider', ProviderSchema);
