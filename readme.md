Oriental Node Plumber
=====================

[OrientDB](http://www.orientdb.org/) +
[node.js](http://nodejs.org/) +
[jsPlumb](http://www.jsplumb.org/) experiment.

## Requirements

### OrientDB

OrientDB is an Open Source NoSQL DBMS with the features of both Document
and Graph DBMSs.

  * __Version__: 1.3.0
  * __Website__: http://www.orientdb.org/
  * __Download__: https://github.com/nuvolabase/orientdb/wiki/Download
  * __Installation guide__: https://github.com/nuvolabase/orientdb/wiki/Installation

### node.js

Node.js is a server side software system designed for writing scalable
Internet applications in JavaScript.

  * __Version__: 0.8.x
  * __Website__: http://nodejs.org/
  * __Download__: http://nodejs.org/download/
  * __Installation guide__: https://github.com/joyent/node/wiki/Installation

## Installation

1. Install node.js and OrientDB.

2. Open `orientdb/config/orientdb-server-config.xml`, find `name="root"`
   and copy the value of the `password` attribute.

3. Run the OrientDB server: `orientdb/bin/server.bin`
   or `orientdb/bin/server.sh`.

4. Run the OrientDB console: `orientdb/bin/console.bin`
   or `orientdb/bin/console.sh` and execute the following command to
   create a database:

         create database remote:localhost/plumber root <PASSWORD> local graph

   Replace `<PASSWORD>` with the password copied from the config file.

5. Close the OrientDB console.

6. Clone the repository:

         git clone git://github.com/morkai/oriental-node-plumber.git

7. Install the dependencies:

         cd oriental-node-plumber/
         npm install

## Usage

1. Execute `node oriental-node-plumber/backend/server.js`. After connecting
   to the database, the application will check whether the required database
   classes exist and automatically create them if they do not.

2. Point your Internet browser to [localhost:3000](http://localhost:3000/).

## License

This project is released under the
[MIT License](https://raw.github.com/morkai/oriental-node-plumber/master/license.md).
