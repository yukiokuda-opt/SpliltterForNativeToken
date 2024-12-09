require("dotenv").config({ path: ".env" });

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Web3 } = require("web3");
const {
  FireblocksSDK,
  PeerType,
  TransactionOperation,
  TransactionStatus,
} = require("fireblocks-sdk");
const {
  FireblocksWeb3Provider,
  ChainId,
} = require("@fireblocks/fireblocks-web3-provider");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

// -------------------COMMON----------------------- //

//// address
const ADDR_ALICE = process.env.ADDR_ALICE;
const ADDR_BOB = process.env.ADDR_BOB;
const ADDR_ELEN = process.env.ADDR_ELEN;
const ADDR_FRIEREN = process.env.ADDR_FRIEREN;
const ADDR_GIORNO = process.env.ADDR_GIORNO;

//// token
const SPLITTER_CA = process.env.SPLITTER_CA;
const SPLITTER_ABI =
  require("../artifacts/contracts/splitter.sol/Splitter.json").abi;

//// explorer
const EXPLOERE = process.env.EXPLOERE;

//// fireblocks
const chainId = ChainId.POLYGON_AMOY; // Polygon Testnet(amoy)
const rpcUrl = process.env.POLYGON_RPC_URL;
const BASE_ASSET_ID = process.env.FIREBLOCKS_ASSET_ID;
const assetId = BASE_ASSET_ID;

// -------------------FIREBLOCKS------------------- //
//// fireblocks - SDK
const fb_apiSecret = fs.readFileSync(
  path.resolve("fireblocks_secret_SIGNER.key"),
  "utf8"
);
const fb_apiKey = process.env.FIREBLOCKS_API_KEY_SIGNER;
const fb_base_url = process.env.FIREBLOCKS_URL;
const fireblocks = new FireblocksSDK(fb_apiSecret, fb_apiKey, fb_base_url);

//// fireblocks - web3 provider - service owner
const fb_vaultId = process.env.FIREBLOCKS_VID_SOURCE;
const eip1193Provider = new FireblocksWeb3Provider({
  privateKey: fb_apiSecret,
  apiKey: fb_apiKey,
  vaultAccountIds: fb_vaultId,
  chainId: chainId,
  rpcUrl: rpcUrl,
});
const web3 = new Web3(eip1193Provider);
const splitter = new web3.eth.Contract(SPLITTER_ABI, SPLITTER_CA);

//// alchemy
const alchemyHTTPS = process.env.ALCHEMY_HTTPS;
const web3_alchemy = createAlchemyWeb3(alchemyHTTPS);

/////////////////////////////////////////
////// send functions ///////////////////
/////////////////////////////////////////

const sendTx = async (_to, _tx, _signer, _gasLimit, _value) => {
  // check toAddress
  const toAddress = web3_alchemy.utils.toChecksumAddress(_to);
  console.log(" toAddress:", toAddress);

  // gasLimit
  const setGasLimit = _gasLimit;
  console.log(" setGasLimit:", setGasLimit);

  // gasPrice
  const gasPrice = await web3_alchemy.eth.getGasPrice();
  const gasPriceInGwei = await web3_alchemy.utils.fromWei(gasPrice, "gwei");
  console.log(" gasPrice:", gasPrice, "(", gasPriceInGwei, "Gwei)");

  // estimate max Transaction Fee
  const estimateMaxTxFee = setGasLimit * gasPrice;
  const estimateMaxTxFeeETH = await web3_alchemy.utils.fromWei(
    estimateMaxTxFee.toString(),
    "ether"
  );
  console.log(
    ` estimate MAX Tx Fee:${estimateMaxTxFee} (${estimateMaxTxFeeETH} ${assetId})`
  );

  // gasHex
  const gasHex = await web3_alchemy.utils.toHex(setGasLimit);
  console.log(` gasHex: ${gasHex}`);

  // dataABI
  const dataABI = _tx.encodeABI();
  console.log(`dataABI: ${dataABI}`);

  const createReceipt = await web3.eth
    .sendTransaction({
      to: toAddress,
      from: _signer,
      data: dataABI,
      gas: gasHex,
      value: _value,
    })
    .once("transactionHash", (txhash) => {
      console.log(` Send transaction ...`);
      console.log(` ${EXPLOERE}/tx/${txhash}`);
    });
  console.log(
    ` Tx successful with hash: ${createReceipt.transactionHash} in block ${createReceipt.blockNumber}`
  );

  return createReceipt;
};

/////////////////////////////////////////
////// tool function ///////////////////
/////////////////////////////////////////

async function _Splitter(addr_list, amount, signer) {
  // entry -----------------

  try {
    console.log(`_Splitter::addr_list::${addr_list}, amount::${amount}`);
    const tx = splitter.methods.splitNativeTokens(addr_list);
    const receipt = await sendTx(SPLITTER_CA, tx, signer, 2000000, amount);
    console.log(`_Splitter::receipt::`, receipt);

    return receipt;
  } catch (error) {
    console.error(`_entry:: Error: ${error.message}`);
  }
}

async function sleepForSeconds(amount) {
  console.log(`Sleeping for ${amount} seconds...`);
  await new Promise((r) => setTimeout(r, amount * 1000)); // milliseconds
  console.log(`${amount} seconds have passed!`);
}

async function getAccountBalance(address) {
  console.log(`Account: ${address}`);

  // native Balance
  const balance = await web3_alchemy.eth.getBalance(address);
  console.log(
    `${assetId} Balance : ${web3_alchemy.utils.fromWei(
      balance,
      "ether"
    )} ${assetId}`
  );
}

/////////////////////////////////////////
////// public functions /////////////////
/////////////////////////////////////////

async function SplitTransfer({ addr_list, amount }) {
  const vaultAddr = await web3.eth.getAccounts();
  const signerAddr = vaultAddr[0];
  console.log("signer address: ", signerAddr);

  const receipt = await _Splitter(addr_list, amount, signerAddr);
  console.log(`_Splitter::receipt::`, receipt);

  return receipt;
}

/////////////////////////////////////////
////// main functions /////////////////
/////////////////////////////////////////

(async () => {
  const amount = 0.1;
  const weiAmount = await web3.utils.toWei(amount.toString(), "ether");

  await SplitTransfer({
    addr_list: [ADDR_ALICE, ADDR_BOB, ADDR_ELEN, ADDR_FRIEREN, ADDR_GIORNO],
    amount: weiAmount,
  });

  console.log("Done!");
})().catch((e) => {
  console.error(`Failed: ${e}`);
  process.exit(-1);
});
