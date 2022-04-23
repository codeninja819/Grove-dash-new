import { ethers } from "ethers";
import {
  MULTICALL_ADDR,
  GROVE_DIVIDEND_ADDR,
  GROVE_PAIR_ADDR,
  GROVE_ADDR,
  GROVE_FARM,
  GROVE_LOCK,
  GROVE_UNLOCK,
} from "../abis/address";
import MultiCallABI from "../abis/MultiCallABI.json";
import GroveDividendABI from "../abis/GroveDividendTracker.json";
import PancakePairABI from "../abis/PancakePairABI.json";
import GroveTokenABI from "../abis/GroveToken.json";
import LockABI from "../abis/LockABI.json";
import UnLockABI from "../abis/UnLockABI.json";
import FarmABI from "../abis/FarmABI.json";

export const RPC_ENDPOINT = {
  1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  56: "https://bsc-dataseed1.binance.org",
};

export const getContract = (abi, address, chainID, signer) => {
  const simpleRpcProvider = new ethers.providers.JsonRpcProvider(
    RPC_ENDPOINT[chainID]
  );
  const signerOrProvider = signer ?? simpleRpcProvider;
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const getDividendContract = (chainID, signer) => {
  return getContract(
    GroveDividendABI,
    GROVE_DIVIDEND_ADDR[chainID],
    chainID,
    signer
  );
};

export const getPairContract = (chainID, signer) => {
  return getContract(PancakePairABI, GROVE_PAIR_ADDR[chainID], chainID, signer);
};

export const getFarmContract = (chainID, signer) => {
  return getContract(FarmABI[chainID], GROVE_FARM[chainID], chainID, signer);
};

export const getTokenContract = (chainID, signer) => {
  return getContract(GroveTokenABI, GROVE_ADDR[chainID], chainID, signer);
};

export const getLockContract = (chainID, signer) => {
  return getContract(LockABI[chainID], GROVE_LOCK[chainID], chainID, signer);
};

export const getUnlockContract = (chainID, signer) => {
  return getContract(UnLockABI, GROVE_UNLOCK[chainID], chainID, signer);
};

export const getMulticallContract = (chainID, signer) => {
  return getContract(MultiCallABI, MULTICALL_ADDR[chainID], chainID, signer);
};

export const multicall = async (abi, calls, chainID) => {
  try {
    const itf = new ethers.utils.Interface(abi);
    const multi = getMulticallContract(chainID);
    const calldata = calls.map((call) => [
      call.address.toLowerCase(),
      itf.encodeFunctionData(call.name, call.params),
    ]);

    const { returnData } = await multi.aggregate(calldata);
    const res = returnData.map((call, i) =>
      itf.decodeFunctionResult(calls[i].name, call)
    );

    return res;
  } catch (error) {
    console.log(error);
  }
};
