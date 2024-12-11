// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Splitter is ReentrancyGuard, Ownable {
    event Split(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event Refund(address indexed sender, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid owner address");
    }

    function splitNativeTokens(address[] memory recipients) external payable nonReentrant {
        require(recipients.length > 0, "Recipients list is empty");
        require(msg.value > 0, "No POL sent");
        require(recipients.length <= 100, "Too many recipients");

        uint256 amountPerRecipient = msg.value / recipients.length;

        for (uint256 i = 0; i < recipients.length; ) {
            require(recipients[i] != address(0), "Invalid recipient address");
            (bool success, ) = payable(recipients[i]).call{value: amountPerRecipient}("");
            require(success, "Transfer failed");
            unchecked { i++; }
        }

        uint256 remainder = msg.value % recipients.length;
        if (remainder > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: remainder}("");
            require(refundSuccess, "Refund failed");
            emit Refund(msg.sender, remainder);
        }

        emit Split(msg.sender, msg.value, recipients.length);
    }

    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: contractBalance}("");
        require(success, "Withdrawal failed");

        emit EmergencyWithdraw(owner(), contractBalance);
    }

    fallback() external payable {}
    receive() external payable {}
}