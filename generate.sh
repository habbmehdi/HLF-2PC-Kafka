#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# add bin directory to PATH
export PATH=${PWD}/bin:${PWD}:$PATH

# define fabric config directory 
export FABRIC_CFG_PATH=${PWD}/fabric-config
CHANNEL_NAME=mychannel

# remove previous crypto material and config transactions
rm -fr config/*
rm -fr crypto-config/*

# generates certificates and keys on crypto-config directory
cryptogen generate --config=./fabric-config/crypto-config.yaml
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# generate orderer.block on config directory
configtxgen -profile OneOrgsOrdererGenesis -outputBlock ./network-config/orderer.block

if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel config transaction on config/channel.tx
configtxgen -profile OneOrgsChannel -outputCreateChannelTx ./network-config/channel.tx -channelID mychannel

if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction on config/Org1MSPanchors.tx
configtxgen -profile OneOrgsChannel -outputAnchorPeersUpdate ./network-config/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi
