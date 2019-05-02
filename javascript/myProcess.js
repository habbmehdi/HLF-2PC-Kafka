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