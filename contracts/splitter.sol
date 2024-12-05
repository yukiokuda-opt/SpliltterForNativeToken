// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Splitter is ReentrancyGuard {
    event Split(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event Refund(address indexed sender, uint256 amount);

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
}