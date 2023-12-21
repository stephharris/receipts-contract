// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Challanges is Ownable {
  mapping(address => uint256) public balances;

  event FundsAdded(address indexed wallet, uint256 amount);
  event ChallangeCreated(uint256 indexed challangeId);

  struct Challange {
    string attestation;
    address challenger;
    uint256 entryFee;
    uint256 totalPrize;
    uint256 startTime;
    uint256 endTime;
    bool settled;
    address [] whitelist;
    address [] participants;
    address [] winners;
  }

  uint256 public lastChallangeId = 0;
  mapping(uint256 => Challange) public challanges;

  function addFundsToWallet() external payable {
    require(msg.value > 0, "Must send funds");

    balances[_msgSender()] += msg.value;
    emit FundsAdded(_msgSender(), msg.value);
  }

  function transferFundsFromWallet(address payable to, uint256 amount) external {
    require(balances[_msgSender()] >= amount, "Not enough funds");
    balances[_msgSender()] -= amount;
    to.transfer(amount);
  }

  function getFundsByWallet(address wallet) external view returns (uint256) {
    return balances[wallet];
  }

  function getChallange(uint _id) external view returns (Challange memory) {
    return challanges[_id];
  }

  function createChallange(
    string calldata attestation,
    uint256 entryFee,
    uint256 startTime,
    uint256 endTime,
    address [] calldata whitelist
  ) external payable {
    require(endTime > startTime, "End time must be after start time");
    require(entryFee > 0, "Entry fee must be greater than 0");
    require(balances[_msgSender()] >= entryFee || msg.value >= entryFee, "Insufficient funds for entry fee");

    if(msg.value < entryFee) {
      balances[_msgSender()] -= entryFee;
    }

    Challange memory challange = Challange({
      attestation: attestation,
      challenger: _msgSender(),
      entryFee: entryFee,
      totalPrize: entryFee,
      startTime: startTime,
      endTime: endTime,
      settled: false,
      whitelist: whitelist,
      participants: new address[](0),
      winners: new address[](0)
    });

    challanges[lastChallangeId] = challange;
    emit ChallangeCreated(lastChallangeId);
    lastChallangeId += 1;
  }

  function joinChallange(uint256 challangeId) external payable {
    Challange storage challange = challanges[challangeId];
    require(challange.settled == false, "already settled");
    require(block.timestamp < challange.startTime, "already started");
    require(challange.entryFee <= msg.value || challange.entryFee <= balances[_msgSender()], "Insufficient funds for entry fee");

    if(msg.value < challange.entryFee) {
      balances[_msgSender()] -= challange.entryFee;
    }

    if(challange.whitelist.length > 0) {
      bool isWhitelisted = false;
      for(uint256 i = 0; i < challange.whitelist.length; i++) {
        if(challange.whitelist[i] == _msgSender()) {
          isWhitelisted = true;
          break;
        }
      }
      require(isWhitelisted, "Not whitelisted");
    }

    challange.participants.push(_msgSender());
    challange.totalPrize += challange.entryFee;
  }

  function settleChallange(uint256 challangeId, address [] memory winners) onlyOwner() external {
    Challange storage challange = challanges[challangeId];
    require(challange.settled == false, "already settled");
    require(block.timestamp > challange.endTime, "not ended yet");

    challange.settled = true;
    uint256 totalWinners = winners.length;
    uint256 prizePerWinner = challange.totalPrize / totalWinners + 1;

    for(uint256 i = 0; i < totalWinners; i++) {
      challange.winners.push(winners[i]);
      balances[winners[i]] += prizePerWinner;
    }

    balances[_msgSender()] += prizePerWinner;
  }

  function cancelChallange(uint256 challangeId) onlyOwner() external {
    Challange storage challange = challanges[challangeId];
    require(challange.settled == false, "already settled");

    challange.settled = true;
    uint256 totalParticipants = challange.participants.length;
    uint256 prizePerParticipant = challange.totalPrize / totalParticipants;

    for(uint256 i = 0; i < totalParticipants; i++) {
      balances[challange.participants[i]] += prizePerParticipant;
    }
  }
}