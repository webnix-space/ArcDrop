// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcDropTip is ReentrancyGuard, Ownable {
    IERC20 public usdc;
    uint256 public platformFeeBps = 50;
    address public feeRecipient;
    uint256 public minTipAmount = 100000;

    struct Tip {
        address sender;
        address recipient;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    mapping(address => Tip[]) public receivedTips;
    mapping(address => uint256) public totalReceived;
    mapping(address => uint256) public totalSent;

    event TipSent(address indexed sender, address indexed recipient, uint256 amount, string message, uint256 fee, uint256 timestamp);

    constructor(address _usdc, address _feeRecipient) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    function sendTip(address _recipient, uint256 _amount, string calldata _message) external nonReentrant returns (bool) {
        require(_amount >= minTipAmount, "Tip below minimum");
        require(_recipient != address(0) && _recipient != msg.sender, "Invalid recipient");

        uint256 fee = (_amount * platformFeeBps) / 10000;
        uint256 netAmount = _amount - fee;

        require(usdc.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        require(usdc.transfer(_recipient, netAmount), "Recipient transfer failed");
        if (fee > 0) require(usdc.transfer(feeRecipient, fee), "Fee transfer failed");

        receivedTips[_recipient].push(Tip(msg.sender, _recipient, _amount, _message, block.timestamp));
        totalReceived[_recipient] += _amount;
        totalSent[msg.sender] += _amount;

        emit TipSent(msg.sender, _recipient, _amount, _message, fee, block.timestamp);
        return true;
    }

    function getReceivedTips(address _recipient) external view returns (Tip[] memory) {
        return receivedTips[_recipient];
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee max 5%");
        platformFeeBps = _feeBps;
    }
}
