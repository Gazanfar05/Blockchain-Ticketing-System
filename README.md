# Blockchain Ticketing System

This repository contains two parts:

- a Hardhat project at the root for the smart contracts
- a React app in `frontend/` for the user interface

The main contract is [`contracts/EventTicket.sol`](contracts/EventTicket.sol) and the frontend connects to it through `ethers`.

## Requirements

- Node.js 18 or newer
- npm
- MetaMask in your browser for minting tickets
- A local Hardhat node or a deployed Ethereum-compatible network

## Install

Install dependencies for the smart contract project at the root:

```bash
npm install
```

Install dependencies for the frontend:

```bash
cd frontend
npm install
```

## Run Locally

Start a local blockchain:

```bash
npx hardhat node
```

In a second terminal, deploy the ticket contract to the local network:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The deploy script creates the `EventTicket` contract with a max supply of 100 tickets.

After deployment, update the contract address in [`frontend/src/App.js`](frontend/src/App.js) if it does not match your deployed address. The current frontend uses a hardcoded address:

```js
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

Then start the frontend:

```bash
cd frontend
npm start
```

Open the app in your browser, connect MetaMask to the local Hardhat network, and make sure the wallet has test ETH from the local node accounts.

## Testing

Run the smart contract test suite from the root:

```bash
npx hardhat test
```

## Vercel Deployment

If you are deploying the frontend on Vercel, use these settings:

- Root Directory: `frontend`
- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

Important: the current frontend code points to a local contract address. For production or Vercel, deploy the contract to a public network and replace the address in `frontend/src/App.js`, or move it into an environment variable.

## Project Structure

```text
contracts/          Solidity contracts
scripts/            Deployment scripts
test/                Hardhat tests
frontend/            React UI
ignition/            Hardhat Ignition modules
```

## Useful Commands

```bash
npx hardhat compile
npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
cd frontend && npm start
cd frontend && npm run build
```
