/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

var currntdate;
var transactionId;

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

var express = require('express')
var app = express()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

var evtFired = false;

var voteInit = false;

var Txsubmitted = false;

var myLogger = async function (req, res, next){
   /* myProcess().catch(function(error) {
        console.log(error);
      });*/
while (!Txsubmitted){ 
    await myProcess2().catch(function(error) {
        console.log(error);
    })
    await sleep(5000)
}
while (!voteInit){
    console.log(voteInit);
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
    const userExists = await wallet.exists('user6');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user6', discovery: { enabled: false } });
    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');
    // Get the contract from the network.
    const contract = network.getContract('2-pc');

    const client = await gateway.getClient();

    const channel = await client.getChannel("mychannel");

    var eventHub = channel.getChannelEventHub("peer0.org1.example.com");

    var myAddress = '2';

    var transactionId = 'Tx01';

    var decision = "Commit";

    /*setTimeout(function() {
        if (!evtFired) {
          contract.submitTransaction('verdictTx', transactionId);
        }
    }, 100000);*/

    eventHub.registerChaincodeEvent("2-pc","Tx",
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
console.log("txSubmittedTime ="+ Date.now());
await contract.submitTransaction('voteTx', 'Tx01', '2', 'Commit');
console.log("a + b ="+ (Date.now() - currntdate));
voteInit = true;
console.log(eventHub.isconnected())

} catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
}
}

async function myProcess2() {
    console.log('LOGGED')
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user6');
        if (!userExists) {
            console.log('An identity for the user "user6" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user6', discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('2-pc');
        
        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('queryTx','Tx1');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        if (result != null){
            Txsubmitted = true;
        }

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
  }
  
app.use(myLogger)

app.get('/', function (req, res) {
  console.log('Txid = '+req.Tx);
  res.send('Hello World!');
})

app.listen(3001)