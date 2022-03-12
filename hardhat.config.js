require('dotenv').config()
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@appliedblockchain/chainlink-plugins-fund-link");
require("hardhat-gas-reporter");




/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
  version:  "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      accounts: {
        // count: 1300
      }
    },
    rinkeby:{
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {mnemonic: process.env.MENMONIC}
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: 'USD',
    // gasPrice: 93,
    coinmarketcap: process.env.CMC_API_KEY,
    gasPrice: 40,

    // gasPriceApi:process.env.ETHERSCAN_API_KEY
  }
};
