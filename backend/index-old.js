/*
Dependencies
*/

const express = require("express");
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const admin = require("firebase-admin");
let inspect = require("util").inspect;
let busboy = require("busboy");
let path = require("path");
let os = require("os");
let fs = require("fs");
const UUID = require("uuid-v4");
// console.log(UUID())

/*
  config - express
*/
const app = express();

/*
 consfig -firebase
*/

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "quasagram-f21ba.appspot.com",
});

const db = admin.firestore();
const bucket = getStorage().bucket();

/*
  endpoint - posts
*/
app.get("/posts", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  let posts = [];
  db.collection("posts")
    .orderBy("date", "desc")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        posts.push(doc.data());
      });
      response.send(posts);
    });
});

/*
  endpoint - createPost
*/
app.post("/createPost", (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  let uuid = UUID();

  const bb = busboy({ headers: request.headers });

  let fields = {};
  let fileData = {};

  bb.on("file", (name, file, info) => {
    const { filename, encoding, mimeType } = info;

    console.log(
      `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
      filename,
      encoding,
      mimeType
    );
    // /tmp/4534534-2323423.png
    let filepath = path.join(os.tmpdir(), filename);
    file.pipe(fs.createReadStream(filepath));
    fileData = { filepath, mimeType };
  });

  bb.on("field", (name, val, info) => {
    // console.log(`Field [${name}]: value: %j`, val);
    fields[name] = val;
  });

  bb.on("close", () => {
    // console.log("fields: ", fields);
    bucket.upload(
      fileData.filepath,
      {
        uploadType: "media",
        metadata: {
          metadata: {
            contentType: fileData.mimeType,
            firebaseStorageDownloadTokens: uuid,
          },
        },
      },
      (err, uploadedFile) => {
        if (!err) {
          createDocument(uploadedFile)
        } 
      }
    )

    function createDocument(uploadedFile) {
      db.collection("posts")
        .doc(fields.id)
        .set({
          id: fields.id,
          caption: fields.caption,
          location: fields.location,
          date: parseInt(fields.date),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${uploadedFile.name}?alt=media&token=${uuid}`
        }).then(() => {
          response.send('Post added:', fields.id)
        })
    }
  });
  // Cloud functions:
  // bb.end(request.rawBody)
  request.pipe(bb);
});

/*
  Listen
*/

app.listen(process.env.PORT || 3000);
