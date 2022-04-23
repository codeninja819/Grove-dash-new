
import { ethers, utils } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import memoize from 'fast-memoize';
import { CHAINS } from "../config/networks";

const NETWORK_TIMEOUT = 1000;
const IMPOSSIBLE_ERROR =
  'Unable to perform the operation. Reload the application and try again.';
const TRANSACTION_REPLACED_ERROR =
  'Transaction was replaced by another. Reload the application and find the transaction in the history page.';

const memoized = memoize(
  url => new ethers.providers.StaticJsonRpcProvider(url),
);
export const getWalletProviderName = provider =>
  provider?.connection?.url || null;

export const getRPCUrl = (chainId, returnAsArray = false) =>
  returnAsArray ? CHAINS[chainId || 1].rpcUrls : CHAINS[chainId || 1].rpcUrls[0];

export const getExplorerUrl = (chainId) =>
  (CHAINS[chainId] || CHAINS[1]).blockExplorerUrls;

export const getNetworkLabel = (chainId) =>
  CHAINS[chainId]?.chainName || "Unknown";

export const getAccountString = (address) => {
  const account = getAddress(address);
  const len = account.length;
  return `0x${account.substr(2, 4)}...${account.substr(len - 4, len - 1)}`;
};

export const formatValue = (num, dec) => {
  const str = utils.formatUnits(num, dec);
  const splitStr = str.split('.');
  const beforeDecimal = splitStr[0];
  const afterDecimal = `${(splitStr[1] ?? '').slice(0, 4)}0000`;

  const finalNum = Number(`${beforeDecimal}.${afterDecimal}`);

  return finalNum.toLocaleString('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 1,
  });
};

export const handleWalletError = (error, showError) => {
  if (error?.message && error?.message.length <= 120) {
    showError(error.message);
  } else if (
    error?.message &&
    error?.message.toLowerCase().includes('transaction was replaced')
  ) {
    showError(TRANSACTION_REPLACED_ERROR);
  } else {
    showError(IMPOSSIBLE_ERROR);
  }
};
// eslint-disable-next-line no-promise-executor-return
export const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

export const withTimeout = (ms, promise) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timed out'));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });


const checkRPCHealth = async url => {
  if (!url) return null;
  const tempProvider = memoized(url);
  if (!tempProvider) return null;
  try {
    await Promise.race([
      // eslint-disable-next-line no-underscore-dangle
      tempProvider._networkPromise,
      setTimeout(
        () => Promise.reject(new Error('Network timeout')).catch(() => null),
        NETWORK_TIMEOUT,
      ),
    ]);
    return tempProvider;
  } catch (err) {
    console.error({ providerSetError: err.message });
    return null;
  }
};

export const getValidEthersProvider = async (chainId) => {
  const rpcURLs = getRPCUrl(chainId, true);
  const provider = (await Promise.all(rpcURLs.map(checkRPCHealth))).filter(
    (p) => !!p
  )[0];

  return provider ?? null;
};

export const getEthersProvider = async (chainId) => {
  const provider = await getValidEthersProvider(chainId);
  // if (provider) {
  //   provider
  //     .getBlockNumber()
  //     .then((health) => setRPCHealth(chainId, health))
  //     .catch();
  // }
  return provider;
};
