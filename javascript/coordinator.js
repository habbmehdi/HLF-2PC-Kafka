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
const axios = require('axios')

axios.post('http://localhost:3000',
  'Tx03')
.catch((error) => {
  console.error(error)
})

axios.post('http://localhost:3001',
  'Tx03')
.catch((error) => {
  console.error(error)
})

axios.post('http://localhost:3003',
  'Tx03')

.catch((error) => {
  console.error(error)
})

async function main() {
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
        console.log('1');
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        console.log('2')
        // Get the contract from the network.
        const contract = network.getContract('2-pc');
        console.log('3')
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        currntdate = Date.now();
        console.log("txSubmittedTime ="+ Date.now());
        await contract.submitTransaction('initiateTx', 'Tx01', '1','2','3');
        console.log("a + b ="+ (Date.now() - currntdate));
        //need to send tx details to other nodes here 


        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
