# Meeting-Scheduler-using-Node-Mailer
A simple Node applicatioon to allow user schedule meetings. A reminder email is sent everyday at 9AM about meetings (if any) on a particular day.

## Getting Started
Built on Express and MongoDB using Passort.js for authentication and Nodemailer for sending email reminders.

## Installing
* `npm install`
* `node app.js`
### Note
 To send email every minute for testing purposes, replace the following code in app.js
  `cron.schedule('0 9 * * *, () => {...})`
  with this
  `cron.schedule('* * * * *, () => {...})`

## Points
* Built for VinnovateIT recruitment task
