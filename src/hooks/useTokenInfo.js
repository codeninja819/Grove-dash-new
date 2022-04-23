/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";

import { GROVE_ADDR, GROVE_PAIR_ADDR } from "../abis/address";
import GroveTokenABI from "../abis/GroveToken.json";
import { useWeb3Context, useAddress } from "../context/web3Context";
import {
  getTokenContract,
  multicall,
  getPairContract,
  getDividendContract,
} from "../utils/contracts";

const defaultVal = {
  price: { 1: 0, 56: 0 },
  dailyvolume: 0,
  burnAmount: 0,
  circulatingSupply: 0,
  totalreward: 0,
  holders: 0,
  ethPrice: 0,
  balance: 0,
  pendingReward: 0,
  recentburn: 0,
  fetchData: () => {},
  fetchAccountTokenInfo: () => {},
};

export const TokenInfoContext = React.createContext(defaultVal);

export default function useTokenInfo() {
  return React.useContext(TokenInfoContext);
}

let timerid = null,
  dataid = null;

const apiKeyList = [
  "77d80f7e-0d2b-42cd-9f63-a7d4f71a859e",
  "4b70f4d7-6eb9-4137-95ce-669c8c62a1a6",
  "653af6ae-de63-4c57-afae-102fa235f270",
  "ee4b00b7-82a3-4455-8686-bb37f06c3f09",
  "b31ca43f-19b9-4e8a-a8ea-4631a5c5d00e",
  "ebfc5d08-7624-477f-be26-38f16aedd021",
  "8e4bde20-fa5d-420c-99c7-f9889609b7a9",
  "7d9b1d81-0df1-415b-be2c-6711818beb8a",
  "f76f0be5-e1de-48c1-83cc-fa2e1e1d03e0",
  "9e6e259c-dbd5-4fe9-9cfd-42437b9ef77b",
  "ef8e0b55-42ff-410f-9f08-cad9555f71cb",
  "77c93185-c3a1-4087-b2dd-6c7b5e48b69f",
  "a36a4ae3-0753-4d0a-b211-d165cc1fc8c4",
  "5493a941-ab8c-4988-bc2f-4b37186af11d",
  "bd600400-81ae-4b39-b653-7e43b36e65a7",
  "1000d13f-7719-4e14-aab5-b9c881a9752c",
  "33315471-758e-4671-8a52-50f9f13e52c9",
  "ba53da1e-71d7-49a9-998d-bdce8f660fdb",
];

export function TokenInfoProvider({ children }) {
  const account = useAddress();
  const { chainID } = useWeb3Context();
  const [bPrice, setBPrice] = useState(0);
  const [ePrice, setEPrice] = useState(0);
  const [dailyvolume, setDailyVolume] = useState(0);
  const [circulatingSupply, setCirculatingSupply] = useState(0);
  const [totalreward, setTotalReward] = useState(0);
  const [holders, setHolders] = useState(0);
  const [ethPrice, setETHPrice] = useState(0);
  const [pendingReward, setPendingReward] = useState(0);
  const [balance, setBalance] = useState(0);
  const [recentburn, setRecentBurn] = useState(0);
  const [burnAmount, setBurnAmount] = useState(0);

  async function fetchETHPrice() {
    let result = await axios.get(
      "https://api.etherscan.io/api?module=stats&action=ethprice&apikey=47I5RB52NG9GZ95TEA38EXNKCAT4DMV5RX"
    );
    const _ethPrice = result.data.result.ethusd;
    const pairContract = getPairContract(1);
    const reserves = await pairContract.getReserves();
    const price = (reserves[1] * Number(_ethPrice)) / reserves[0];
    return { price: price ? price : 0, ethPrice: _ethPrice };
  }

  async function fetchBNBPrice() {
    let i;
    let circulatingSupply, rate, volume;
    for (i = 0; i < apiKeyList.length; i++) {
      const response = await fetch(
        new Request("https://api.livecoinwatch.com/coins/single"),
        {
          method: "POST",
          headers: new Headers({
            "content-type": "application/json",
            "x-api-key": apiKeyList[i],
          }),
          body: JSON.stringify({
            currency: "USD",
            code: "GVR",
            meta: true,
          }),
        }
      );
      const result = await response.json();
      if (!result.rate) continue;
      circulatingSupply = result.circulatingSupply;
      rate = result.rate;
      volume = result.volume;
      break;
    }
    console.log(i);
    if (i === apiKeyList.length) {
      circulatingSupply = 0;
      rate = 0;
      volume = 0;
    }
    return { circulatingSupply, rate, volume };
  }
  async function fetchData() {
    try {
      const dividendContract = getDividendContract(chainID);
      dividendContract
        .totalDividendsDistributed()
        .then((data) => {
          setTotalReward(data / Math.pow(10, 18));
        })
        .catch((error) => console.log(error));

      let calls = [
        {
          address: GROVE_ADDR[chainID],
          name: "getNumberOfDividendTokenHolders",
          params: [],
        },
        {
          address: GROVE_ADDR[chainID],
          name: "totalSupply",
          params: [],
        },
      ];

      multicall(GroveTokenABI, calls, chainID)
        .then((result) => {
          setHolders(result[0][0] / 1);
          setBurnAmount(
            (ethers.utils.parseEther("100000000000000000") - result[1][0]) /
              Math.pow(10, 18)
          );

          if (chainID === 1) {
            setCirculatingSupply(result[1][0] / Math.pow(10, 18));
          }
        })
        .catch((error) => console.log(error));

      if (chainID === 1) {
        axios
          .get(
            `https://api.etherscan.io/api?module=account&action=tokentx&address=0x0000000000000000000000000000000000000000&contractaddress=${GROVE_ADDR[chainID]}&page=1&offset=1&sort=desc&apikey=47I5RB52NG9GZ95TEA38EXNKCAT4DMV5RX`
          )
          .then((data) => {
            setRecentBurn(data.data.result[0].value / Math.pow(10, 18));
          })
          .catch((error) => console.log(error));
      } else {
        axios
          .get(
            `https://api.bscscan.com/api?module=account&action=tokentx&address=0x0000000000000000000000000000000000000000&contractaddress=${GROVE_ADDR[chainID]}&page=1&offset=1&sort=desc&apikey=HQ1F33DXXJGEF74NKMDNI7P8ASS4BHIJND`
          )
          .then((data) => {
            setRecentBurn(data.data.result[0].value / Math.pow(10, 18));
          })
          .catch((error) => console.log(error));
      }
      fetchBNBPrice().then((data) => {
        setBPrice(data.rate);
        if (chainID === 56) {
          setCirculatingSupply(data.circulatingSupply);
          setDailyVolume(data.volume);
        }
      });
      fetchETHPrice().then((data) => {
        setEPrice(data.price);
        setETHPrice(data.ethPrice);
        if (chainID === 1) {
          axios
            .get(
              `https://api.etherscan.io/api?module=account&action=tokentx&address=${GROVE_PAIR_ADDR[chainID]}&contractaddress=${GROVE_ADDR[chainID]}&page=1&offset=400&sort=desc&apikey=47I5RB52NG9GZ95TEA38EXNKCAT4DMV5RX`
            )
            .then((_dvolume) => {
              _dvolume = _dvolume.data.result;
              let volume = 0;
              for (let i = 0; i < _dvolume.length; i++) {
                if (
                  _dvolume[i].to &&
                  _dvolume[i].to.toLowerCase() ===
                    GROVE_ADDR[chainID].toLowerCase()
                )
                  continue;
                if (
                  _dvolume[i].timeStamp / 1 <
                  _dvolume[0].timeStamp / 1 - 3600 * 24
                ) {
                  break;
                }
                volume += _dvolume[i].value / Math.pow(10, 18);
              }
              console.log(volume * data.price);
              setDailyVolume(volume * data.price ? volume * data.price : 0);
            })
            .catch((error) => console.log(error));
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchAccountTokenInfo() {
    try {
      const dividendContract = getDividendContract(chainID);
      dividendContract
        .withdrawableDividendOf(account)
        .then((data) => {
          setPendingReward(data / Math.pow(10, 18));
        })
        .catch((error) => console.log(error));
      const tokenContract = getTokenContract(chainID);
      tokenContract
        .balanceOf(account)
        .then((data) => {
          setBalance(data);
        })
        .catch((error) => console.log(error));
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!(chainID === 1 || chainID === 56)) return;
    fetchData();
    if (dataid) clearInterval(dataid);
    dataid = setInterval(() => {
      fetchData();
    }, 60000);
  }, [chainID]);

  useEffect(() => {
    if (!account || !(chainID === 1 || chainID === 56)) return;
    fetchAccountTokenInfo();
    if (timerid) clearInterval(timerid);
    timerid = setInterval(() => {
      fetchAccountTokenInfo();
    }, 20000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainID]);

  return (
    <TokenInfoContext.Provider
      value={{
        price: { 1: ePrice, 56: bPrice },
        dailyvolume,
        circulatingSupply,
        totalreward,
        recentburn,
        holders,
        ethPrice,
        pendingReward,
        balance,
        burnAmount,
        fetchData,
        fetchAccountTokenInfo,
      }}
      children={children}
    />
  );
}
