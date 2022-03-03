// test/CreativeFriendz-2.test.js
// Load dependencies
const { expect } = require('chai');
const { parseEther } = require('ethers/lib/utils');
const { ethers,  network, deployments, run} = require('hardhat');



// Start test block
describe('BoomBabies', function () {
    before(async function () {
        this.Token = await ethers.getContractFactory('GreenTeaTeas');
    });


    this.beforeEach(async function() {
        const signers = await ethers.getSigners();
        this.token = await this.Token.deploy(  /*whitelist:*/ [signers[1].address, signers[2].address]);
        await this.token.deployed();
    })


    it("only allows whitelisted people to mint", async function() {
        const signers = await ethers.getSigners();

        await expect(
            this.token.connect(signers[3]).mint(1, {value: parseEther('0.5').toString()})
        ).to.be.revertedWith("Not whitelisted and public mint not started");

        await this.token.connect(signers[2]).mint(1, {value: parseEther('0.5').toString()});
    });



});
