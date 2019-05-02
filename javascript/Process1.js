/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

var express = require('express')
var app = express()

var t = 5;

function rejectDelay(reason) {
    return new Promise(function(resolve, reject) {
        setTimeout(reject.bind(null, reason), t); 
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

var evtFired = false;

var voteInit = false;

var myLogger = async function (req, res, next){
   /* myProcess().catch(function(error) {
        console.log(error);
      });*/
while (!voteInit){
    await myProcess(req.body).catch(function(error) {
        console.log(error);
      })
      await sleep(5000)
}
    next();
}

async function myProcess(txId) {
  console.log('LOGGED')
  try {

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');
    // Get the contract from the network.
    const contract = network.getContract('2pc');

    const client = await gateway.getClient();

    const channel = await client.getChannel("mychannel");

    var eventHub = channel.getChannelEventHub("peer0.org1.example.com");

    eventHub.connect(true);

    var myAddress = '1';

    var transactionId = txId;

    var decision = "Commit";

    voteInit = true;

    /*setTimeout(function() {
        if (!evtFired) {
          contract.submitTransaction('verdictTx', transactionId);
        }
    }, 100000);*/

    eventHub.registerChaincodeEvent("2pc","Tx",
    (event, block_num, txnid, status)=>{
    console.log(eventHub.isconnected())
    console.log('Successfully got a chaincode event with transid:'+ txnid + ' with status:'+status);
    console.log('Successfully received the chaincode event on block number '+ block_num);
    console.log('test : '+event.payload.toString('utf8'));
    if (event.payload.toString('utf8') == "Verdict :Abort" || event.payload.toString('utf8') == "Verdict :Commit"){
    evtFired = true;
    console.log("txRecievedTime ="+ Date.now());
    console.log('Outcome : '+ event.payload.toString('utf8'));
    eventHub.disconnect();
        }
    },(error)=>{
    console.log('Failed to receive the chaincode event ::'+error);
    console.log('2')
    }
);
currntdate = Date.now();
await contract.submitTransaction('voteTx', transactionId, myAddress, decision);
console.log("txSubmittedTime ="+ Date.now());
console.log("a + b ="+ (Date.now() - currntdate));
voteInit = true;
console.log(eventHub.isconnected())

} catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
}
}
  
app.use(myLogger)

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000)

// We’re setting up an extremely simple server here.
/*const http = require('http');

var async = require('async');

var body = '';

var server = http.createServer( (req, res) => {
  if (req.method === 'POST') {
    req.on('data',async chunk => {
        body += chunk.toString(); // convert Buffer to string
        console.log('pausing')
        req.pause
        console.log('paused')
    });
    req.on('end', () => {
        res.end('ok');
    });
} 
})

server.listen(5000)

console.log(`App running at http://localhost:5000`);
/*
async.parallel(calls, function(err, result) {
  /* this code will run after all calls finished the job or
     when any of the calls passes an error */
/*  if (err)
      return console.log(err);
  console.log(result);
});

/*
async function main() {

    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('2pc');

        const client = await gateway.getClient();

        const channel = await client.getChannel("mychannel");

        var eventHub = channel.getChannelEventHub("peer0.org1.example.com");

        eventHub.connect(true);

        var myAddress = '1';

        var transactionId = "Tx17";

        var decision = "Commit";

        await contract.submitTransaction('voteTx', transactionId, myAddress, decision);

        var evtFired = false;
        setTimeout(function() {
            if (!evtFired) {
              contract.submitTransaction('verdictTx', transactionId);
            }
        }, 100000);

        eventHub.registerChaincodeEvent("2pc","Tx",
        (event, block_num, txnid, status)=>{
        console.log('Successfully got a chaincode event with transid:'+ txnid + ' with status:'+status);
        console.log('Successfully received the chaincode event on block number '+ block_num);
        console.log('test : '+event.payload.toString('utf8'));

        if (event.payload.toString('utf8') == "Transaction state :Abort" || event.payload.toString('utf8') == "Transaction state :Commit"){
        evtFired = true;
        console.log('Outcome : '+ event.payload.toString('utf8'));
        eventHub.disconnect();
            }
        },(error)=>{
        console.log('Failed to receive the chaincode event ::'+error);
        console.log('2')
        }
    );

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();

/*'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', '..', 'basic-network', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
// We’re setting up an extremely simple server here.
const http = require('http');

// These could (should) be set as env vars.
const port =  5000;
const host =  'localhost';

var body = '';

// No matter what hits the server, we send the same thing.
http.createServer( async (req, res) => {

  if (req.method === 'POST') {
    req.on('data',async chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    console.log('asuhd')
    myfunc(body)
    req.on('end', () => {
        res.end('ok');
    });
}
}).listen(port, host);

async function myfunc(body) {
  try {

      // Create a new file system based wallet for managing identities.
      const walletPath = path.join(process.cwd(), 'wallet');
      const wallet = new FileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);

      // Check to see if we've already enrolled the user.
      const userExists = await wallet.exists('user1');
      if (!userExists) {
          console.log('An identity for the user "user1" does not exist in the wallet');
          console.log('Run the registerUser.js application before retrying');
          return;
      }

      // Create a new gateway for connecting to our peer node.
      const gateway = new Gateway();
      await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
      // Get the network (channel) our contract is deployed to.
      const network = await gateway.getNetwork('mychannel');
      // Get the contract from the network.
      const contract = network.getContract('2pc');

      const client = await gateway.getClient();

      const channel = await client.getChannel("mychannel");

      var eventHub = channel.getChannelEventHub("peer0.org1.example.com");

      eventHub.connect(true);

      var myAddress = '1';

      var transactionId = body;

      var decision = "Commit";

      await contract.submitTransaction('voteTx', transactionId, myAddress, decision);

      var evtFired = false;
      setTimeout(function() {
          if (!evtFired) {
            contract.submitTransaction('verdictTx', transactionId);
          }
      }, 100000);

      eventHub.registerChaincodeEvent("2pc","Tx",
      (event, block_num, txnid, status)=>{
      console.log('Successfully got a chaincode event with transid:'+ txnid + ' with status:'+status);
      console.log('Successfully received the chaincode event on block number '+ block_num);
      console.log('test : '+event.payload.toString('utf8'));

      if (event.payload.toString('utf8') == "Transaction state :Abort" || event.payload.toString('utf8') == "Transaction state :Commit"){
      evtFired = true;
      console.log('Outcome : '+ event.payload.toString('utf8'));
      eventHub.disconnect();
          }
      },(error)=>{
      console.log('Failed to receive the chaincode event ::'+error);
      console.log('2')
      }
  );

  } catch (error) {
      console.error(`Failed to evaluate transaction: ${error}`);
      process.exit(1);
  }
}

// This message prints in the console when the app starts.
console.log(`App running at http://${host}:${port}`);*/
