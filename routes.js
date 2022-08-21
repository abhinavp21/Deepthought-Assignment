require('dotenv').config()
var express = require('express');
var router = express.Router();
const mongo = require('mongodb');
const client = new mongo.MongoClient(process.env.URL);
const multer = require('multer')
var multiparty = require('multiparty');
var path = require('path')

const { GridFsStorage } = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')


// Database Name
const dbName = 'userDB';
const db = client.db(dbName);
const collection = db.collection('events');

let gfs
function main() {
    client.connect().then(() => {
        // gfs = Grid(db, mongo)
        // gfs.collection("employees")
        console.log('Connected successfully to mongodb server');
    },
        (error) => {
            console.log(error);
        })
}
main()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage })

// const storage = new GridFsStorage({
//     db, client,
//     file: (req, file) => {
//         // const match = ["image/png", "image/jpeg"];

//         // if (match.indexOf(file.mimetype) === -1) {
//         //     const filename = `${Date.now()}-any-name-${file.originalname}`;
//         //     return filename;
//         // }

//         return {
//             bucketName: "employees",
//             filename: file.originalname
//         };
//     }
// });

router.get('/', async function (req, res) {
    // console.log(req.query.id);
    const event_id = req.query.id;
    if (event_id != undefined) {
        try {
            const event = await collection.findOne({ _id: mongo.ObjectId(event_id) })
            res.send(event)
        } catch (err) {
            console.log(err);
        }

    }
    else {
        var asc = 1, lim = 2, pag = 1
        var { type, limit, page } = req.query
        if (type != undefined) {
            if (type == "latest")
                asc = -1
        }
        if (limit != undefined) {
            lim = limit
            lim = parseInt(lim)
        }
        if (page != undefined)
            pag = page
        collection.find().sort({ $natural: asc }).skip((pag - 1) * lim).limit(lim).toArray((err, result) => {
            console.log("hello");
            if (err)
                req.send(err)
            else
                res.send(result)
        })

    }
    // res.send('GET route on things.');
});

router.post('/', function (req, res) {
    var form = new multiparty.Form();
    var event = {}
    form.parse(req, function (err, fields, files) {
        Object.keys(fields).forEach(key => {
            if (key == "schedule") {
                event[key] = new mongo.Timestamp(fields[key][0])
            }
            else if (key == "attendees") {
                console.log(fields[key][0]);
                event[key] = fields[key][0].split(" ")
            }
            else
                event[key] = fields[key][0]
        })

        if (files != null) {
            const tempImages = []
            upload.array('images', 12)
            files.images.forEach(file => {
                tempImages.push({
                    name: file.originalFilename,
                    location: path.join(__dirname + "/uploads") + file.originalFilename
                })
            })
            event.images = tempImages
        }
        collection.insertOne(event, (err, result) => {
            if (err)
                console.log(err);
            else
                res.send(result.insertedId)
        })
    });
});

router.put('/:id', function (req, res) {
    const id = req.params
    console.log(id);
    var form = new multiparty.Form();
    var event = {}
    form.parse(req, function (err, fields, files) {
        Object.keys(fields).forEach(key => {
            event[key] = fields[key][0]
        })

        if (files != null) {
            const tempImages = []
            upload.array('images', 12)
            files.images.forEach(file => {
                tempImages.push(file.originalFilename)
            })
            event.images = tempImages
        }
        collection.updateOne({ _id: mongo.ObjectId(id) }, {
            $set: event
        }, (err, result) => {
            if (err)
                console.log(err);
            console.log(result);
            res.status(200)
        })
    });
});

router.delete('/:id', function (req, res) {
    const id = req.params
    collection.deleteOne({ _id: mongo.ObjectId(id) }, (err, result) => {
        if (err)
            console.log(err);
        console.log(result);
        res.status(200)
    })
});


//export this router to use in our index.js
module.exports = router