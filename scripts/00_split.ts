import { ethers } from "hardhat";
import 'dotenv/config';

import Splitter from '../artifacts/contracts/splitter.sol/Splitter.json';

async function main() {
  // コントラクトアドレス
  const contractAddress = process.env.CONTRACT_ADDRESS as string;
  const distributedAddress = [
    '0x0b6ad461A7F980f5dEA8fDDec67f6a51d56fCf0C', 
    '0xb27537CC0eaa5E24aBA2D9f0dC9c9DccbE5C7fDb',
  ]
  const amount = ethers.parseEther("0.02");
  
  // コントラクトABI（コントラクトのインターフェース定義）
  const contractABI = Splitter.abi;

  // 署名者の取得
  const signers = await ethers.getSigners();
  const signer = signers[0];

  // コントラクトインスタンスの作成
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    // mintの呼び出し
    const tx = await contract.splitNativeTokens(distributedAddress, {
      value: amount
    });
    console.log("Call transaction:", tx.hash);

    // トランザクションの完了を待つ
    await tx.wait();
    console.log("splitNativeTokens transaction confirmed");
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });