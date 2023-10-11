# Receipts Contracts

## Hardhat help
```shell
npx hardhat help
```
## Hardhat tests
```shell
npx hardhat test
```

## Deployment
Before running below scripts providing private keys in `.env` file is necessary. Check `.env.example` for reference. 
```shell
npx hardhat run scripts/deploy.ts --network base-goerli
```
```shell
npx hardhat run scripts/deploy.ts --network base-mainnet
```

## Verification
```shell
npx hardhat verify --network base-goerli 0x2457A37603AcbD968b389f27eeA8955F4b3df534
```
```shell
npx hardhat verify --network base-mainnet 0x39d18BD615c5c8Dc1FD2E139B2dd6fcF4Ba27999
```
## Setting Price for minting 
- Go to explorer page of verified contract. For example: https://basescan.org/address/0x39d18BD615c5c8Dc1FD2E139B2dd6fcF4Ba27999
- Click Contract > Write as Proxy 
- Connect wallet that is owner / deployer of contract 
- Click "setPrice" 
- Specify new price (in WEI) and treasury addresss 