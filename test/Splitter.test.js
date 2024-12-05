const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Splitter コントラクト", function () {
  let Splitter;
  let splitter;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    Splitter = await ethers.getContractFactory("Splitter");
    splitter = await Splitter.deploy();
    await splitter.waitForDeployment();
    console.log("Splitter Address:", splitter.target);

    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    console.log("Owner Address:", owner.address);
    console.log("Address 1:", addr1.address);
    console.log("Address 2:", addr2.address);
    console.log("Address 3:", addr3.address);
  });

  describe("splitNativeTokens 関数", function () {
    it("指定された受信者にEtherが正しく分配される", async function () {
      const recipients = [addr1.address, addr2.address, addr3.address];
      const sendValue = ethers.parseEther("3.0"); // 合計 3 ETH
      const amountPerRecipient = ethers.parseEther("1.0"); // 各受信者に 1 ETH

      const bal1Before = await ethers.provider.getBalance(addr1.address);
      const bal2Before = await ethers.provider.getBalance(addr2.address);
      const bal3Before = await ethers.provider.getBalance(addr3.address);
      console.log("Address 1 BalBefore:", ethers.formatEther(bal1Before));
      console.log("Address 2 BalBefore:", ethers.formatEther(bal2Before));
      console.log("Address 3 BalBefore:", ethers.formatEther(bal3Before));

      await expect(
        splitter
          .connect(owner)
          .splitNativeTokens(recipients, { value: sendValue })
      )
        .to.emit(splitter, "Split")
        .withArgs(owner.address, sendValue, recipients.length);

      const bal1After = await ethers.provider.getBalance(addr1.address);
      const bal2After = await ethers.provider.getBalance(addr2.address);
      const bal3After = await ethers.provider.getBalance(addr3.address);
      console.log("Address 1 BalAfter:", ethers.formatEther(bal1After));
      console.log("Address 2 BalAfter:", ethers.formatEther(bal2After));
      console.log("Address 3 BalAfter:", ethers.formatEther(bal3After));

      expect(bal1After).to.equal(bal1Before + amountPerRecipient);
      expect(bal2After).to.equal(bal2Before + amountPerRecipient);
      expect(bal3After).to.equal(bal3Before + amountPerRecipient);
    });

    it("受信者数が100を超える場合に失敗する", async function () {
      const recipients = Array(101).fill(addr1.address);
      const sendValue = ethers.parseEther("101.0");

      await expect(
        splitter
          .connect(owner)
          .splitNativeTokens(recipients, { value: sendValue })
      ).to.be.revertedWith("Too many recipients");
    });

    it("受信者にゼロアドレスが含まれている場合に失敗する", async function () {
      const recipients = [addr1.address, ethers.ZeroAddress];
      const sendValue = ethers.parseEther("2.0");

      await expect(
        splitter
          .connect(owner)
          .splitNativeTokens(recipients, { value: sendValue })
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("再入可能性攻撃に対して安全であることを確認する", async function () {
      // 再入可能性攻撃用のモックコントラクトをデプロイ
      const Attacker = await ethers.getContractFactory("ReentrancyAttack");
      const attacker = await Attacker.deploy(splitter.target);
      await attacker.waitForDeployment();
      console.log("Attacker Address:", attacker.target);

      const recipients = [attacker.target];
      const sendValue = ethers.parseEther("1.0");

      await expect(
        splitter
          .connect(owner)
          .splitNativeTokens(recipients, { value: sendValue })
      ).to.be.revertedWith("Transfer failed");
    });
  });
});
