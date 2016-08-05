var mongoose = require('mongoose');
var chalk    = require('chalk');


var dbURI = 'mongodb://127.0.0.1/hangout';
console.log(chalk.yellow("Establishing connection to the DB"));

mongoose.connect(dbURI);

// Handle connection error
mongoose.connection.on('error', function (err) {
  console.log(chalk.red('Mongoose connection error: ' + err));
});

// Handle success error
mongoose.connection.on("connected",function(){
    console.log(chalk.green("Database connection successful"));
});

/*** uSers schema ***/
var userSchema = new mongoose.Schema({
    name     : {type:String},
    username : {type : String, unique : true},
    password : {type : String}
});

mongoose.model( 'Users', userSchema );
