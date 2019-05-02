/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', '..', 'basic-network', 'connection.json');
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
    await myProcess().catch(function(error) {
        console.log(error);
      })
      await sleep(5000)
}
    next();
}

async function myProcess() {
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

    var transactionId = "Tx33";

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
await contract.submitTransaction('voteTx', transactionId, myAddress, decision);
console.log("txSubmittedTime ="+ Date.now());
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

app.listen(3001)