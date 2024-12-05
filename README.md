# Welcome to SplitterForNativeToken

## 使用方法

### `splitNativeTokens` 関数

指定した受取人リストに対して、送信者が送信した ETH を均等に分配します。

- **パラメータ:**

  - `recipients`：受取人のアドレス配列

- **要件:**
  - 受取人リストは空であってはならない。
  - 送信される ETH の量はゼロより大きくなければならない。
  - 受取人の数は 100 を超えてはいけない。

### 例 1: 3 人の受取人に分配

送信者が 3 人の受取人に対して 9 ETH を分配する場合。

```javascript
const recipients = [
  "0xRecipientAddress1",
  "0xRecipientAddress2",
  "0xRecipientAddress3",
];
const amount = ethers.utils.parseEther("9.0");
const tx = await splitter.splitNativeTokens(recipients, { value: amount });
await tx.wait();
```

- 各受取人は 3 ETH を受け取ります。
- `Split` イベントが発行されます。

## イベント

### `Split`

- **説明:** トランザクションの分割が完了した際に発行されます。
- **パラメータ:**
  - `sender`：送信者のアドレス
  - `totalAmount`：送信された総額
  - `recipientCount`：受取人の数

### `Refund`

- **説明:** 余剰金が送信者に返金された際に発行されます。
- **パラメータ:**
  - `sender`：送信者のアドレス
  - `amount`：返金された金額

## セキュリティ

- **再入防止:** `nonReentrant` 修飾子を使用して再入攻撃を防止しています。
- **アドレス検証:** 受取人のアドレスがゼロアドレスでないことを確認しています。
- **送金成功確認:** 各送金および返金が成功したかを確認しています。

## 注意事項

- 受取人の数が多すぎるとガスコストが高くなる可能性があります。受取人リストは最大 100 人までと制限しています。
- ERC20 トークンの分配ではなく、ネイティブトークン（ETH）の分配に対応しています。

## deployment

### polygon amoy

```bash
npx hardhat run scripts/deploy.js --network hardhat
npx hardhat run scripts/deploy.js --network amoy_metamask
npx hardhat verify --network amoy_metamask 0xe915010848E4E9ECC2669C02CE887A170e55406e
```

[Polygonscan amoy](https://amoy.polygonscan.com/address/0xe915010848E4E9ECC2669C02CE887A170e55406e)
