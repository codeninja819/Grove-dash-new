import { utils } from "ethers";
import { CHAINS } from "../../config/networks";

export const addTokenToMetamask = async ({ address, symbol, decimals }) =>
  window.ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20",
      options: {
        address,
        symbol,
        decimals,
      },
    },
  });

const trySwitchChain = async (chainId) =>
  window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [
      {
        chainId: utils.hexValue(chainId),
      },
    ],
  });

const tryAddChain = async (chainId) =>
  window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [CHAINS[chainId]],
  });

export const addChainToMetaMask = async (chainId) => {
  const add = ![1, 4, 56, 97].includes(chainId);
  if (add) {
    try {
      await tryAddChain(chainId);
      return true;
    } catch (addError) {
      console.error({ addError });
    }
    return false;
  }

  try {
    await trySwitchChain(chainId);
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await tryAddChain(chainId);
        return true;
      } catch (addError) {
        console.error({ addError });
      }
    } else {
      console.error({ switchError });
    }
  }
  return false;
};
