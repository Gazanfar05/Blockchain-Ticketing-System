const hre = require("hardhat");

async function main() {
  const Ticket = await hre.ethers.getContractFactory("EventTicket");
  const ticket = await Ticket.deploy(100); // Deploy with max supply of 100
  await ticket.waitForDeployment(); // <== This is the correct method

  console.log("🎟️ EventTicket deployed at:", await ticket.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});