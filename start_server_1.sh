#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.


# start fabric containers
docker-compose -f deployment/docker-compose-kafka.yml up -d

sleep 10
sleep 10

# start cli container
docker-compose -f deployment/docker-compose-cli.yml up -d


docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer0.example.com:7050 -c mychannel -f /var/hyperledger/configs/channel.tx

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block

# copy mychannel.block from peer0 to host
docker cp peer0.org1.example.com:/mychannel.block .

# copy mychannel.block to peer1 and peer2
docker cp mychannel.block peer1.org1.example.com:/mychannel.block
docker cp mychannel.block peer2.org1.example.com:/mychannel.block

# remove mychannel.block from host
rm mychannel.block

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer1.org1.example.com peer channel join -b mychannel.block

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer2.org1.example.com peer channel join -b mychannel.block

# define connecting peer to peer0 on docker-compose-cli.yaml
- CORE_PEER_ADDRESS=peer0.org1.example.com:7051

# install chaincode 
docker exec -it cli peer chaincode install -n 2pc -p github.com/chaincode/2pc -v v0


# define connecting peer to peer1 on docker-compose-cli.yaml
CORE_PEER_ADDRESS=peer1.org1.example.com:8051

# install chaincode 
docker exec -it cli peer chaincode install -n 2pc -p github.com/chaincode/2pc -v v0

# define connecting peer to peer2 on docker-compose-cli.yaml
CORE_PEER_ADDRESS=peer2.org1.example.com:0051

# install chaincode 
docker exec -it cli peer chaincode install -n 2pc -p github.com/chaincode/2pc -v v0

docker exec -it cli peer chaincode instantiate -o orderer0.example.com:7050 -C mychannel -n 2pc github.com/chaincode/2pc -v v0 -c '{"Args": ["a", "100"]}'



