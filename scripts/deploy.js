require("dotenv").config({ path: ".env" });
const hre = require("hardhat");

async function main() {
  let splitter;
  const Splitter = await hre.ethers.getContractFactory("Splitter");
  splitter = await Splitter.deploy();
  await splitter.waitForDeployment();
  console.log("Splitter deployed to:", splitter.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
