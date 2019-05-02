package main

import (
	//"bytes"
	"encoding/json"
	"fmt"
	//"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

type Tx struct {
	TxId        string    `json:"txid"`
	State       string    `json:"state"`
	VoteN       int       `json:"voten"`
	Addr        []string  `json:"addr"`
	VotedAddr   []string  `json:"votedaddr"`
}


func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}


func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "initiateTx" {
		return s.initiateTx(APIstub, args)
	} else if function == "queryTx" {
		return s.queryTx(APIstub, args)
	} else if function == "voteTx"  {
		return s.voteTx(APIstub, args)
	}
	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) initiateTx(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) < 3 {
		return shim.Error("Incorrect number of arguments. Expecting 4 or more")
	}
	
	//marshall test
	var tx Tx 
	tx = Tx{TxId: args[1], State: args[2], VoteN: 0}
	tx.Addr = make([]string, len(args)-3)
	tx.VotedAddr = make([]string, 0)
	for i := 0 ; i < len(args)-3; i++ {
		tx.Addr[i] = args[i+3]
	}
	txAsBytes, err := json.Marshal(tx)
	if err != nil {
		return shim.Error(err.Error())
	}

	APIstub.PutState(args[0], txAsBytes)

	return shim.Success(nil)

    /*txAsBytes, err = APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}

	var tx2 Tx
	 
	err = json.Unmarshal(coordAsByte, &tx2)
	if err != nil{
		return shim.Error(err.Error())
	} 

	tx2.State = "Test"

	txAsBytes, err = json.Marshal(tx2)
	if err != nil {
		return shim.Error(err.Error())
	}

	APIstub.PutState(args[0], txAsBytes)*/

	return shim.Success(nil)

	/*//unmarshal test
	var t Tx
	err = json.Unmarshal(data, &t)
	if err != nil {
		fmt.Printf("There was an error decoding the json. err = %s", err)
		return
	}
	fmt.Printf("decoded json is: %#v\r\n", t)*/


}

func (s *SmartContract) queryTx(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	txAsBytes, err := APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(txAsBytes)
}

func (s *SmartContract) voteTx(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	txAsBytes, err := APIstub.GetState(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}
	
	var tx Tx

	err = json.Unmarshal(txAsBytes, &tx)
	if err != nil{
		return shim.Error(err.Error())
	} 

	if tx.State != "Voting" {
		return shim.Error("Decision has already been made")
	}

	if stringInSlice(args[1],tx.VotedAddr) {
		return shim.Error("Adress already Voted")
	}

	tx.VotedAddr = append(tx.VotedAddr, args[1]) 
	
	if args[2] == "Commit" {
		tx.VoteN = tx.VoteN + 1

		if sliceEquals(tx.VotedAddr,tx.Addr) && tx.VoteN == len(tx.Addr) {
			tx.State = "Commit"
		}		
	}else {
		tx.State = "Abort"
	}

	txAsBytes, err = json.Marshal(tx)
	if err != nil {
		return shim.Error(err.Error())
	}

	APIstub.PutState(args[0], txAsBytes)

    eventPayload:="Transaction state :" + tx.State
    payloadAsBytes := []byte(eventPayload)
	err = APIstub.SetEvent("Tx",payloadAsBytes)

	if err != nil {
		return shim.Error(err.Error())
	}
		

	return shim.Success(nil)

}

func stringInSlice(str string, list []string) bool {
	for _, v := range list {
		if v == str {
			return true
		}
	}
	return false
}

func sliceEquals(list1 []string, list2 []string) bool {
	if len(list1) != len(list2){
		return false
	}else{
         for _, v := range list1 {
		     if !stringInSlice(v, list2){
				 return false
	        }
	    }
	}
	return true
}

func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
