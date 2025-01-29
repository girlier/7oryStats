const mysql = require('mysql');
const key = require('./key')

exports.connection =
// connects to the database
    mysql.createConnection({
    host: key.host,
    user: key.dbuser,
    password: key.dbpass,
    database: key.db,
});

exports.connect = function() {
    sql.connection.connect();
}