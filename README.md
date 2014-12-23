codesnail [![Build Status](https://travis-ci.org/silps/codesnail.svg?branch=master)](https://travis-ci.org/silps/codesnail) [![Dependency Status](https://www.versioneye.com/user/projects/549087169bc626ff60000010/badge.svg?style=flat)](https://www.versioneye.com/user/projects/549087169bc626ff60000010)
=========

A website where users learn to code while competing against each other

setup
=====

basic setup
-----------
* install node.js http://nodejs.org/download/
* install mongoDB http://www.mongodb.org/downloads
* download git repo https://github.com/silps/codesnail/archive/master.zip
* run cmd or terminal and go to the project directory
* run npm install
* set the MONGOLAB_URI environment variable
* run node app
* open http://127.0.0.1:3000
```bash
sudo apt-get install nodejs npm mongodb
git clone https://github.com/silps/codesnail.git
cd codesnail
npm install
export MONGOLAB_URI="mongodb://dbuser:dbpass@host:port/dbname"
node app
firefox 127.0.0.1:3000
```

additional setup
----------------
```bash
# APP CONF #
export APP_NAME="CodeSnail"
export ADMIN_NAME="John Schmidt"
export HOSTNAME="http://localhost:3000"
export ADMIN_EMAIL="<admin-email>"
export SESSION_SECRET="mega-awesome-secret-yay"
# SMTP CONF #
export SMTP_HOST="<smtp-host>"
export SMTP_USERNAME="<smtp-username>"
export SMTP_PASSWORD="<smtp-password>"
# OAUTH CONF #
export GOOGLE_KEY="<google-key>"
export GOOGLE_SECRET="<google-secret>"
export GITHUB_KEY="<github-key>"
export GITHUB_SECRET="<github-secret>"
export TWITTER_KEY="<twitter-key>"
export TWITTER_SECRET="<twitter-secret>"
export FACEBOOK_KEY="<facebook-key>"
export FACEBOOK_SECRET="<facebook-secret>"
export LINKEDIN_KEY="<linkedin-key>"
export LINKEDIN_SECRET="<linkedin-secret>"
```

links
=====

* report about codesnail on sharelatex https://www.sharelatex.com/project/52e8420b7487ca4941000b9f

credits ^_^
===========

* http://socket.io/
* http://nodejs.org/
* https://travis-ci.org/
* https://mongolab.com/
* http://www.mongodb.org/
* https://www.sharelatex.com/
* https://www.versioneye.com/
* https://github.com/share/ShareJS/
