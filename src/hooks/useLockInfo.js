/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { GROVE_ADDR, GROVE_LOCK, GROVE_UNLOCK } from "../abis/address";
import GroveTokenABI from "../abis/GroveToken.json";
import LockABI from "../abis/LockABI.json";
import UnLockABI from "../abis/UnLockABI.json";
import { useAddress, useWeb3Context } from "../context/web3Context";
import { multicall } from "../utils/contracts";

const defaultVal = {
  lockinfo: [{}, {}, {}, {}],
  lockallow: false,
  unlockallow: false,
  accountlockinfo: [{}, {}, {}, {}],
  fetchLockData: () => {},
  fetchAccountLockData: () => {},
  fetchAllowance: () => {},
};

export const LockInfoContext = React.createContext(defaultVal);

export default function useLockInfo() {
  return React.useContext(LockInfoContext);
}
let timerid = null,
  lockid = null;
export function LockInfoProvider({ children }) {
  const account = useAddress();
  const [lockinfo, setLockInfo] = useState([{}, {}, {}]);
  const [unlockinfo, setUnlockInfo] = useState({});
  const [accountlockinfo, setAccountLockInfo] = useState([{}, {}, {}]);
  const [accountunlockinfo, setAccountUnlockInfo] = useState({});
  const [lockallow, setLockAllow] = useState(false);
  const [unlockallow, setUnLockAllow] = useState(false);

  const { chainID } = useWeb3Context();

  async function fetchLockData() {
    try {
      let calls = [
        {
          address: GROVE_LOCK[chainID],
          name: "performanceFee",
          params: [],
        },
        {
          address: GROVE_LOCK[chainID],
          name: "bonusEndBlock",
          params: [],
        },
      ];

      for (let i = 0; i < 3; i++)
        calls.push({
          address: GROVE_LOCK[chainID],
          name: "lockups",
          params: [i],
        });

      const result = await multicall(LockABI[chainID], calls, chainID);
      let temp = [];
      for (let i = 0; i < 3; i++) {
        const rate =
          (result[i + 2].rate / result[i + 2].totalStaked) *
          (chainID === 56 ? 28800 : 6219) *
          36500 *
          (chainID === 56 ? 44.33 / 46.48 : 108.37 / 103.29);
        temp.push({
          depositFee: result[i + 2].depositFee / 100,
          withdrawFee: result[i + 2].withdrawFee / 100,
          duration: result[i + 2].duration / 1,
          rate,
          performanceFee: result[0][0],
          endsIn: result[1][0] - result[i + 2].lastRewardBlock,
          totalStaked: result[i + 2].totalStaked / Math.pow(10, 18),
        });
      }
      console.log(temp);
      setLockInfo(temp);
    } catch (error) {
      console.log(error);
    }
  }
  async function fetchUnlockData() {
    let calls = [
      {
        address: GROVE_UNLOCK[chainID],
        name: "depositFee",
        params: [],
      },
      {
        address: GROVE_UNLOCK[chainID],
        name: "withdrawFee",
        params: [],
      },
      {
        address: GROVE_UNLOCK[chainID],
        name: "performanceFee",
        params: [],
      },
      {
        address: GROVE_UNLOCK[chainID],
        name: "rewardPerBlock",
        params: [],
      },
      {
        address: GROVE_UNLOCK[chainID],
        name: "totalStaked",
        params: [],
      },
      {
        address: GROVE_UNLOCK[chainID],
        name: "bonusEndBlock",
        params: [],
      },
      {
        address: GROVE_UNLOCK[chainID],
        name: "lastRewardBlock",
        params: [],
      },
    ];
    const result = await multicall(UnLockABI, calls, chainID);
    const rate =
      (result[3][0] / result[4][0]) *
      36500 *
      (chainID === 56 ? 28800 : 6219) *
      (chainID === 56 ? 1 : 61.39 / 58.51);
    console.log(rate);
    setUnlockInfo({
      depositFee: result[0][0] / 100,
      withdrawFee: result[1][0] / 100,
      rate,
      performanceFee: result[2][0],
      endsIn: result[5][0] - result[6][0],
      totalStaked: result[4][0] / Math.pow(10, 18),
      duration: 0,
    });
  }
  async function fetchAccountLockData() {
    try {
      let calls = [];
      for (let i = 0; i < 3; i++) {
        calls.push({
          address: GROVE_LOCK[chainID],
          name: "pendingReward",
          params: [account, i],
        });
        calls.push({
          address: GROVE_LOCK[chainID],
          name: "pendingDividends",
          params: [account, i],
        });
        calls.push({
          address: GROVE_LOCK[chainID],
          name: "userInfo",
          params: [i, account],
        });
      }
      const result = await multicall(LockABI[chainID], calls, chainID);
      let temp = [];
      for (let i = 0; i < 3; i++)
        temp.push({
          pendingReward: result[i * 3][0] / Math.pow(10, 18),
          pendingDividends: result[i * 3 + 1][0] / Math.pow(10, 18),
          stakedAmount: result[i * 3 + 2][0],
          available: result[i * 3 + 2][1],
        });
      console.log(temp);
      setAccountLockInfo(temp);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchAccountUnlockData() {
    try {
      let calls = [
        {
          address: GROVE_UNLOCK[chainID],
          name: "pendingReward",
          params: [account],
        },
        {
          address: GROVE_UNLOCK[chainID],
          name: "pendingDividends",
          params: [account],
        },
        {
          address: GROVE_UNLOCK[chainID],
          name: "userInfo",
          params: [account],
        },
      ];
      const result = await multicall(UnLockABI, calls, chainID);
      setAccountUnlockInfo({
        pendingReward: result[0][0] / Math.pow(10, 18),
        pendingDividends: result[1][0] / Math.pow(10, 18),
        stakedAmount: result[2][0],
        available: result[2][1],
      });
    } catch (error) {
      console.log(error);
    }
  }
  async function fetchAllowance() {
    try {
      let calls = [
        {
          name: "allowance",
          address: GROVE_ADDR[chainID],
          params: [account, GROVE_LOCK[chainID]],
        },
        {
          name: "allowance",
          address: GROVE_ADDR[chainID],
          params: [account, GROVE_UNLOCK[chainID]],
        },
      ];
      const result = await multicall(GroveTokenABI, calls, chainID);
      setLockAllow(result[0][0] > ethers.utils.parseEther("10000"));
      setUnLockAllow(result[1][0] > ethers.utils.parseEther("10000"));
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!(chainID === 1 || chainID === 56)) return;
    fetchLockData();
    if (lockid) clearInterval(lockid);
    lockid = setInterval(() => {
      fetchLockData();
      fetchUnlockData();
    }, 20000);
  }, [chainID]);

  useEffect(() => {
    if (!account || !(chainID === 1 || chainID === 56)) return;
    fetchAccountLockData();
    fetchAccountUnlockData();
    fetchAllowance();
    if (timerid) clearInterval(timerid);
    timerid = setInterval(() => {
      fetchAccountLockData();
      fetchAccountUnlockData();
      fetchAllowance();
    }, 20000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainID]);

  return (
    <LockInfoContext.Provider
      value={{
        lockinfo: [unlockinfo, lockinfo[0], lockinfo[1], lockinfo[2]],
        lockallow,
        unlockallow,
        accountlockinfo: [
          accountunlockinfo,
          accountlockinfo[0],
          accountlockinfo[1],
          accountlockinfo[2],
        ],
        fetchLockData,
        fetchAccountLockData,
        fetchAllowance,
      }}
      children={children}
    />
  );
}
