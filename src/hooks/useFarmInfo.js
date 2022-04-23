/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { GROVE_FARM, GROVE_PAIR_ADDR, GROVE_ADDR } from "../abis/address";
import FarmABI from "../abis/FarmABI.json";
import PancakePairABI from "../abis/PancakePairABI.json";
import { useAddress, useWeb3Context } from "../context/web3Context";
import { multicall } from "../utils/contracts";
import useTokenInfo from "./useTokenInfo";

const defaultVal = {
  allowance: false,
  farminfo: [{}],
  accountfarminfo: [{}],
  farmprice: 0,
  liquidity: 0,
  farmbalance: 0,
  fetchFarmData: () => {},
  fetchAccountFarmData: () => {},
};

export const FarmInfoContext = React.createContext(defaultVal);

export default function useFarmInfo() {
  return React.useContext(FarmInfoContext);
}
let timerid = null,
  farmid = null;
export function FarmInfoProvider({ children }) {
  const account = useAddress();
  const { price, ethPrice } = useTokenInfo();
  const [allowance, setAllowance] = useState(false);
  const [accountfarminfo, setAccountFarmInfo] = useState([{}]);
  const [farmprice, setFarmPrice] = useState(0);
  const [performanceFee, setPerformanceFee] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [rate, setRate] = useState(null);
  const [depositFee, setDepositFee] = useState(null);
  const [withdrawFee, setWithdrawFee] = useState(null);
  const [farmbalance, setFarmBalance] = useState(0);

  const { chainID } = useWeb3Context();

  async function fetchFarmData() {
    try {
      let calls = [
        {
          address: GROVE_FARM[chainID],
          name: "poolInfo",
          params: [0],
        },
        {
          address: GROVE_FARM[chainID],
          name: "performanceFee",
          params: [],
        },
        {
          address: GROVE_FARM[chainID],
          name: "rewardPerBlock",
          params: [],
        },
      ];

      let data = await multicall(FarmABI[chainID], calls, chainID);
      const pool = data[0];
      setDepositFee(pool.depositFee / 100);
      setWithdrawFee(pool.withdrawFee / 100);
      console.log(pool.depositFee / 100, pool.withdrawFee / 100);
      const performanceFee = data[1][0];
      setPerformanceFee(performanceFee);
      const _rewardPerBlock = data[2][0] / Math.pow(10, 18);

      calls = [
        {
          address: GROVE_PAIR_ADDR[chainID],
          name: "balanceOf",
          params: [GROVE_FARM[chainID]],
        },
        {
          address: GROVE_PAIR_ADDR[chainID],
          name: "getReserves",
          params: [],
        },
        {
          address: GROVE_PAIR_ADDR[chainID],
          name: "totalSupply",
          params: [],
        },
      ];

      data = await multicall(PancakePairABI, calls, chainID);

      const totalStaked = data[0][0] / Math.pow(10, 18);
      setTotalStaked(totalStaked);

      const reserves = data[1];
      const totalSupply = data[2][0] / Math.pow(10, 18);
      let price, _price;
      if (chainID === 1) {
        _price = (reserves[1] * Number(ethPrice)) / reserves[0];
        price =
          (2 *
            Math.sqrt(
              ((reserves[0] / Math.pow(10, 18)) * reserves[1]) /
                Math.pow(10, 18)
            ) *
            Math.sqrt(_price * ethPrice)) /
          totalSupply;
      } else if (chainID === 56) {
        price = await axios.get(
          `https://api.pancakeswap.info/api/v2/tokens/${GROVE_ADDR[chainID]}`
        );
        price = price.data.data;
        _price = price.price;
        price =
          (2 *
            Math.sqrt(
              ((reserves[0] / Math.pow(10, 18)) * reserves[1]) /
                Math.pow(10, 18)
            ) *
            Math.sqrt((price.price * price.price) / price.price_BNB)) /
          totalSupply;
      }
      setFarmPrice(price);
      if (price !== 0) {
        if (chainID === 56) {
          console.log(_price, price, _rewardPerBlock / 1, totalStaked);
          setRate(
            (_rewardPerBlock * 28800 * 36500 * _price) / (totalStaked * price)
          );
        } else if (chainID === 1)
          setRate(
            (((_rewardPerBlock * 6219 * 36500 * _price) /
              (totalStaked * price)) *
              151.56) /
              144.45
          );
      }
      console.log(price);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchAccountFarmData() {
    try {
      let calls = [
        {
          address: GROVE_FARM[chainID],
          name: "pendingReflections",
          params: [0, account],
        },
        {
          address: GROVE_FARM[chainID],
          name: "pendingRewards",
          params: [0, account],
        },
        {
          address: GROVE_FARM[chainID],
          name: "userInfo",
          params: [0, account],
        },
      ];
      multicall(FarmABI[chainID], calls, chainID).then((data) => {
        const pendingReflections = data[0][0] / Math.pow(10, 18);
        const pendingRewards = data[1][0] / Math.pow(10, 18);
        const stakedAmount = data[2].amount;
        setAccountFarmInfo([
          {
            pendingReflections,
            pendingRewards,
            stakedAmount,
          },
        ]);
      });
      calls = [
        {
          address: GROVE_PAIR_ADDR[chainID],
          name: "balanceOf",
          params: [account],
        },
        {
          address: GROVE_PAIR_ADDR[chainID],
          name: "allowance",
          params: [account, GROVE_FARM[chainID]],
        },
      ];
      multicall(PancakePairABI, calls, chainID).then((data) => {
        setFarmBalance(data[0][0]);
        setAllowance(data[1][0] >= ethers.utils.parseEther("10000"));
      });
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!(chainID === 1 || chainID === 56)) return;
    fetchFarmData();
    if (farmid) clearInterval(farmid);
    farmid = setInterval(() => {
      fetchFarmData();
    }, 20000);
  }, [price, ethPrice, chainID]);

  useEffect(() => {
    if (!account || !(chainID === 1 || chainID === 56)) return;
    fetchAccountFarmData();
    if (timerid) clearInterval(timerid);
    timerid = setInterval(() => {
      fetchAccountFarmData();
    }, 20000);
  }, [account, chainID]);

  return (
    <FarmInfoContext.Provider
      value={{
        allowance,
        accountfarminfo,
        farmbalance,
        farminfo: [
          {
            depositFee,
            withdrawFee,
            rate,
            performanceFee,
            totalStaked,
          },
        ],
        farmprice,
        fetchFarmData,
        fetchAccountFarmData,
      }}
      children={children}
    />
  );
}
