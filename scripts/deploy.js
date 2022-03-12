// scripts/deploy.js
async function main () {
    // We get the contract to deploy
    const Token = await ethers.getContractFactory('GreenTeaTeas');
    console.log('Deploying NFT...');
    const token = await Token.deploy([
        '0x43bB8236d44DBbD649f7A42b09cc939237E9Cc05', // GTT Owner
        '0xfb3b9175158E821B61CC0837890822a5Df27D523' // Yordi

    ], [
        '0xCcddE7C216b13c0625a5573a267B8831cce0FcB1' // Dwayne
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
