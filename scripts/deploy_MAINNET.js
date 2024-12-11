require("dotenv").config({ path: ".env" });
const CONTRACT_OWNER = process.env.CONTRACT_OWNER_MAINNET;

const hre = require("hardhat");

async function main() {
  let splitter;
  const Splitter = await hre.ethers.getContractFactory("Splitter");
  splitter = await Splitter.deploy(CONTRACT_OWNER);
  await splitter.waitForDeployment();
  console.log("Splitter deployed to:", splitter.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
