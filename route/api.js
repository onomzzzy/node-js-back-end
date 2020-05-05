const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { MongoClient } = require("mongodb");
const salting = require("../models/salting");
const MongoKey = require("../models/secret");
const { jwtKey } = require("../models/secret");

async function main(user) {
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
   */
  const uri = MongoKey();

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    // Make the appropriate DB calls
    //await listDatabases(client);
    return await findOneUserByUserName(client, user);
  } catch (e) {
    console.error(e);
    return null;
  } finally {
    await client.close();
  }
}

//main().catch(console.error);

async function findOneUserByUserName(client, user) {
  const result = await client
    .db("onomecode")
    .collection("Users")
    .findOne({ username: user.username });
  if (result) {
    try {
      let ex = user.exp;
      return result;
    } catch (error) {
      let salt = salting(user);
      let auth = result.password === salt;
      if (auth) {
        return result;
      }
      return null;
    }
  } else {
    return null;
  }
}

const jwtKey = JwtKey();
const jwtExpirySeconds = 86400;

function verifyToken(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized request");
  }
  let token = req.headers.authorization;
  if (token === "null") {
    return res.status(401).send("Unauthorized request");
  }
  let payload;
  try {
    payload = jwt.verify(token, jwtKey);
    // let result = "" + JSON.stringify(payload);
    //console.log(`payload ${result}`);
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      // if the error thrown is because the JWT is unauthorized, return a 401 error
      return res.status(401).send(null);
    }
    // otherwise, return a bad request error
    return res.status(400).send(null);
  }

  if (!payload) {
    return res.status(401).send(null);
  }
  let result = JSON.stringify(payload);
  req.id = result;
  next();
}

/*async function listDatabases(client) {
  databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
}*/

router.get("/login", (req, res) => {
  let usr = JSON.parse("" + JSON.stringify(req.body));
  console.log(`Got here ${usr}`);
  main(req.body).then((data) => {
    let user = JSON.parse("" + JSON.stringify(data));
    console.log(` fom login ${JSON.stringify(data)}`);
    if (user == null || user === "") {
      console.log(`sending Null`);
      res.send(null);
    } else {
      let payload = { username: user.username };
      let token = jwt.sign(payload, jwtKey, {
        algorithm: "HS256",
        expiresIn: jwtExpirySeconds,
      });
      res.send(token);
    }
  });
});

router.get("/user", verifyToken, (req, res) => {
  let id = req.id + "";
  let user = JSON.parse(id);
  main(user).then((data) => {
    let user = JSON.parse("" + JSON.stringify(data));
    if (user == null || user === "") {
      res.send(null);
    } else {
      res.send(user);
    }
  });
});

router.put("/salt", (req, res) => {
  let user = JSON.parse("" + JSON.stringify(req.body));
  let result = salting(user);
  res.send(result);
});

module.exports = router;
