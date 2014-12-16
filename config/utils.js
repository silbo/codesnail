/* Add modules */
var crypto = require('crypto'),
    db = require('./database'),
    config = require('./config');

var tasks = [];
var currentTask = 0;

exports.getTasks = function getTasks() {
    return tasks;
}

/* Get new task */
exports.getTask = function getTask() {
    /* Update tasks */
    db.Task.find(function(err, db_tasks) {
        if (err) return new Error(err);
        else tasks = etasks = db_tasks;
    });
    if (tasks.length == 0) return { name: "Currently no tasks available" };
    return { name: tasks[currentTask].name, points: tasks[currentTask].points };
}

/* Check if task is complete */
exports.taskComplete = function taskComplete(code) {
    if (tasks.length == 0) return false;
    /* When task was completed */
    if (code.replace(/\s+/g, '').match(tasks[currentTask].verification)) {
        currentTask = (currentTask + 1) % tasks.length;
        return true;
    }
    return false;
}

/* Hashing function */
exports.calculateHash = function calculateHash(type, text) {
    var shasum = crypto.createHash(type);
    shasum.update(text);
    return shasum.digest('hex');
}

/* Random function */
exports.generateRandom = function generateRandom() {
    /* TODO: Add existing check, or add date + time */
    var current_date = (new Date()).valueOf().toString();
    var random = parseInt(Math.random()*100);
    return random;
}

/* Generate a random guest account */
exports.generateGuest = function generateGuest() {
    var random = exports.generateRandom();
    var randomEmailHash = exports.calculateHash('md5', random + "@mail.com");
    var user = {
        name: "Guest" + random,
        email: random + "@mail.com",
        guest: true,
        profile: {
            mugshot: config.gravatar.mugshot + randomEmailHash + "?d=identicon",
            website: config.gravatar.profile,
            description: "",
            points: 0
        },
        verification: { verified: true }
    };
    console.log("INFO", "generated guest user:", user);
    return user;
}
