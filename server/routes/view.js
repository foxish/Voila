/**
 * Created by arunxls on 4/26/16.
 */

var express = require('express');
var router = express.Router();

var sqlite3 = require('sqlite3').verbose();

/* GET users listing. */
router.get('/', function(req, res, next) {

    //Move into common method
    var file = "./test.db";
    var db = new sqlite3.Database(file);

    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS data (videoID INTEGER, pattern TEXT, timestamp INTEGER)");
    });
    //Move into common method

    req.body['videoID'] = 100;
    var query = 'SELECT * FROM data WHERE videoID='+ req.body['videoID'];

    db.all(query, function(err, rows) {
        //Convert back JSON from string pattern
        res.json(JSON.stringify(rows));
    });

    db.close();
});

router.post('/', function(req, res) {
    console.log(req.body);
    
    //Move into common method
    var file = "./test.db";
    var db = new sqlite3.Database(file);
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS data (videoID INTEGER, pattern TEXT, timestamp INTEGER)");
    });
    //Move into common method

    var stmt = db.prepare("INSERT INTO data (videoID,pattern,timestamp) VALUES (?,?,?)");

    stmt.run(req.body.videoID, req.body.pattern.toString(), req.body.timestamp);
    stmt.finalize();

    db.close();

    res.send('successfully added to database');
});

module.exports = router;
