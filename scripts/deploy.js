// scripts/deploy.js
async function main () {
    // We get the contract to deploy
    const Token = await ethers.getContractFactory('GreenTeaTeas');
    console.log('Deploying NFT...');
    const token = await Token.deploy([
        '0x656B15205BC23c880D86c9A2Ff9143Da67ae6CAC', // Test ACcount
        '0xCcddE7C216b13c0625a5573a267B8831cce0FcB1', // Dwayne
        '0x43bB8236d44DBbD649f7A42b09cc939237E9Cc05', // Owner

    ], [
        '0x43bB8236d44DBbD649f7A42b09cc939237E9Cc05' // Owner
    ]);
    await token.deployed();
    console.log('NFT deployed to:', token.address);
  }

  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
