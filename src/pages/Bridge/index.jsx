/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Box, CircularProgress, useMediaQuery, Skeleton } from "@mui/material";
import { BigNumber, ethers } from "ethers";
import CountUp from "react-countup";
import { AiFillCaretDown } from "react-icons/ai";
import { toast } from "react-toastify";
import styled from "styled-components";

import { CHAINS, CHAIN_ICONS } from "../../config/networks";
import { useBridgeContext } from "../../context/BridgeContext";
import { useWeb3Context } from "../../context/web3Context";
import { useBridgeDirection } from "../../hooks/useBridgeDirection";
import useTokenInfo from "../../hooks/useTokenInfo";
import { useTokenLimits } from "../../hooks/useTokenLimits";
import { useApproval } from "../../hooks/useApproval";
import { isRevertedError } from "../../lib/bridge/amb";
import { fetchTokenBalance } from "../../lib/bridge/token";
import { priceFormat } from "../../utils/functions";
import {
  formatValue,
  getAccountString,
  getExplorerUrl,
  getNetworkLabel,
  handleWalletError,
} from "../../utils/helper";

import DropDown from "../../components/DropDown";
import Button from "../../components/Button";
import { BridgeLoadingModal } from "./modals/BridgeLoadingModal";
import { BridgeHistory } from "./history";

const useDelay = (fn, ms) => {
  const timer = useRef(0);

  const delayCallBack = useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(fn.bind(this, ...args), ms || 0);
    },
    [fn, ms]
  );

  return delayCallBack;
};

const Bridge = () => {
  const chains = ["ETH", "BNB"];
  const percents = ["%", "25%", "50%", "75%", "100%"];

  const { address: account, connected, connect, chainID } = useWeb3Context();
  const { homeChainId, foreignChainId, getBridgeChainId, getTotalConfirms } = useBridgeDirection();
  const {
    txHash,
    fromToken,
    fromBalance,
    fromAmount,
    setFromBalance,
    setAmount,
    amountInput,
    setAmountInput,

    receiver,
    toToken,
    toBalance,
    toAmount,
    toAmountLoading,
    setToBalance,

    loading,
    transfer,
  } = useBridgeContext();

  const { price } = useTokenInfo();
  const { tokenLimits } = useTokenLimits();
  const { allowed, approve, unlockLoading } = useApproval(fromToken, fromAmount, txHash);

  const [network, setNetwork] = useState(chainID);
  const [fromChainID, setFromChainID] = useState(1);
  const [toChainID, setToChainID] = useState(0);
  const [percent, setPercent] = useState(0);
  const [prices, setPrices] = useState({
    1: {
      prevalue: 0,
      value: 0,
      detail: "",
    },
    56: {
      prevalue: 0,
      value: 0,
      detail: "",
    },
  });

  const [balanceLoading, setBalanceLoading] = useState(true);
  const [toBalanceLoading, setToBalanceLoading] = useState(true);

  const md = useMediaQuery("(max-width : 950px)");
  const sm = useMediaQuery("(max-width : 750px)");
  const xs = useMediaQuery("(max-width : 550px)");
  const xx = useMediaQuery("(max-width : 600px)");
  const xxs = useMediaQuery("(max-width : 400px)");

  useEffect(() => {
    if (fromToken && account) {
      (async () => {
        try {
          setBalanceLoading(true);
          const b = await fetchTokenBalance(fromToken, account);
          setFromBalance(b);
        } catch (fromBalanceError) {
          setFromBalance(BigNumber.from(0));
          console.error({ fromBalanceError });
        } finally {
          setBalanceLoading(false);
        }
      })();
    } else {
      setFromBalance(BigNumber.from(0));
    }
  }, [txHash, fromToken, account, setFromBalance, setBalanceLoading]);

  useEffect(() => {
    if (toToken && account) {
      (async () => {
        try {
          setToBalanceLoading(true);
          const b = await fetchTokenBalance(toToken, account);
          setToBalance(b);
        } catch (toBalanceError) {
          setToBalance(BigNumber.from(0));
          console.error({ toBalanceError });
        } finally {
          setToBalanceLoading(false);
        }
      })();
    } else {
      setToBalance(BigNumber.from(0));
    }
  }, [txHash, toToken, account, setToBalance, setToBalanceLoading]);

  useEffect(() => {
    async function switchNetwork() {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${network.toString(16)}` }],
        });
      } catch (err) {
        console.log(err);
        if (err.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [CHAINS[network]],
            });
          } catch (e) {
            console.log(e);
          }
        }
        setNetwork(fromToken.chainId);
        setFromChainID(chains.indexOf(CHAINS[fromToken?.chainId ?? 56].nativeCurrency.symbol));
        setToChainID(chains.indexOf(CHAINS[toToken?.chainId ?? 1].nativeCurrency.symbol));
      }
    }
    if (network === homeChainId || network === foreignChainId) {
      switchNetwork();
    }
  }, [network, fromToken, toToken]);

  useEffect(() => {
    setNetwork(chainID);

    setFromChainID(
      chains.indexOf(CHAINS[getBridgeChainId(getBridgeChainId(chainID))].nativeCurrency.symbol)
    );
    setToChainID(chains.indexOf(CHAINS[getBridgeChainId(chainID)].nativeCurrency.symbol));
  }, [chainID]);

  useEffect(() => {
    setPrices({
      1: {
        prevalue: prices[1].value,
        value: price[1],
        detail: (
          <Box>
            $ 0.0
            {Number(prices[1].value) || Number(price[1]) ? (
              <span style={{ fontSize: xx ? (xxs ? "8px" : "12px") : "16px" }}>
                {priceFormat(price[1]).count}
              </span>
            ) : (
              ""
            )}
            <CountUp
              start={priceFormat(prices[1].value).value}
              end={priceFormat(price[1]).value}
              formattingFn={(value) => {
                return value;
              }}
            />
          </Box>
        ),
      },
      56: {
        prevalue: prices[56].value,
        value: price[56],
        detail: (
          <Box>
            $ 0.0
            {Number(prices[56].value) || Number(price[56]) ? (
              <span style={{ fontSize: xx ? (xxs ? "8px" : "12px") : "16px" }}>
                {priceFormat(price[56]).count}
              </span>
            ) : (
              ""
            )}
            <CountUp
              start={priceFormat(prices[56].value).value}
              end={priceFormat(price[56]).value}
              formattingFn={(value) => {
                return value;
              }}
            />
          </Box>
        ),
      },
    });
  }, [price[56], price[1]]);

  const updateAmount = useCallback(() => setAmount(amountInput), [amountInput, setAmount]);
  const delayedSetAmount = useDelay(updateAmount, 500);

  const showError = useCallback(
    (msg) => {
      if (msg) toast.error(msg);
    },
    [toast]
  );

  const unlockButtonDisabled =
    !fromToken || allowed || toAmountLoading || !(connected && chainID === fromToken?.chainId);

  const transferButtonEnabled =
    !!fromToken &&
    allowed &&
    !loading &&
    !toAmountLoading &&
    connected &&
    chainID === fromToken?.chainId;

  const approveValid = useCallback(() => {
    if (!chainID) {
      showError("Please connect wallet");
      return false;
    }
    if (chainID !== fromToken?.chainId) {
      showError(`Please switch to ${getNetworkLabel(fromToken?.chainId)}`);
      return false;
    }
    if (fromAmount.lte(0)) {
      showError("Please specify amount");
      return false;
    }
    if (fromBalance.lt(fromAmount)) {
      showError("Not enough balance");
      return false;
    }
    return true;
  }, [chainID, fromToken?.chainId, fromAmount, fromBalance, showError]);

  const onApprove = useCallback(() => {
    if (!unlockLoading && !unlockButtonDisabled && approveValid()) {
      approve().catch((error) => {
        console.log(error);
        if (error && error.message) {
          if (
            isRevertedError(error) ||
            (error.data &&
              (error.data.includes("Bad instruction fe") || error.data.includes("Reverted")))
          ) {
            showError(
              <Box>
                There is problem with the token unlock. Try to revoke previous approval if any on{" "}
                <Link href="https://revoke.cash" textDecor="underline" isExternal>
                  https://revoke.cash/
                </Link>{" "}
                and try again.
              </Box>
            );
          } else {
            handleWalletError(error, showError);
          }
        } else {
          showError("Impossible to perform the operation. Reload the application and try again.");
        }
      });
    }
  }, [unlockLoading, unlockButtonDisabled, approveValid, showError, approve]);

  const transferValid = useCallback(() => {
    if (!chainID) {
      showError("Please connect wallet");
    } else if (chainID !== fromToken?.chainId) {
      showError(`Please switch to ${getNetworkLabel(fromToken?.chainId)}`);
    } else if (
      tokenLimits &&
      (fromAmount.gt(tokenLimits.remainingLimit) ||
        tokenLimits.remainingLimit.lt(tokenLimits.minPerTx))
    ) {
      showError("Daily limit reached. Please try again tomorrow or with a lower amount");
    } else if (tokenLimits && fromAmount.lt(tokenLimits.minPerTx)) {
      showError(
        `Please specify amount more than ${formatValue(tokenLimits.minPerTx, fromToken.decimals)}`
      );
    } else if (tokenLimits && fromAmount.gt(tokenLimits.maxPerTx)) {
      showError(
        `Please specify amount less than ${formatValue(tokenLimits.maxPerTx, fromToken.decimals)}`
      );
    } else if (fromBalance.lt(fromAmount)) {
      showError("Not enough balance");
    } else if (receiver && !ethers.utils.isAddress(receiver)) {
      showError(`Please specify a valid recipient address`);
    } else {
      return true;
    }
    return false;
  }, [chainID, tokenLimits, fromToken, fromAmount, fromBalance, receiver, account, showError]);

  const onTransfer = useCallback(() => {
    if (transferButtonEnabled && transferValid()) {
      transfer().catch((error) => handleWalletError(error, showError));
    }
  }, [transferButtonEnabled, transferValid, transfer]);

  const fromChainChanged = (index) => {
    if (index !== fromChainID) {
      setNetwork(toToken.chainId);
      setFromChainID(index);
    }
  };

  const toChainChanged = (index) => {
    if (index !== toChainID) {
      setNetwork(toToken.chainId);
      setToChainID(index);
    }
  };

  const onPercentSelected = (index) => {
    if (fromBalance && fromToken) {
      setAmountInput(
        ethers.utils
          .formatUnits(fromBalance.mul(25 * index).div(100), fromToken.decimals)
          .toString()
      );
      setAmount(
        ethers.utils
          .formatUnits(fromBalance.mul(25 * index).div(100), fromToken.decimals)
          .toString()
      );
    }
    setPercent(index);
  };

  const renderActions = () => {
    if (!account) {
      return (
        <Button
          type={"primary"}
          width={"100%"}
          height={xx ? "28px" : "50px"}
          fontSize={xx ? "12px" : "16px"}
          onClick={connect}
        >
          Connect Wallet
        </Button>
      );
    }
    if (!fromToken) {
      return (
        <Button
          type={"primary"}
          width={"100%"}
          height={xx ? "28px" : "50px"}
          fontSize={xx ? "12px" : "16px"}
          onClick={() => setNetwork(fromToken?.chainId)}
        >
          Loading...
        </Button>
      );
    }

    if (chainID !== fromToken?.chainId) {
      return (
        <Button
          type={"primary"}
          width={"100%"}
          height={xx ? "28px" : "50px"}
          fontSize={xx ? "12px" : "16px"}
          onClick={() => setNetwork(fromToken?.chainId)}
        >
          Switch Chain({getNetworkLabel(fromToken?.chainId)})
        </Button>
      );
    }

    if (!allowed) {
      return (
        <Button
          type={"primary"}
          width={"100%"}
          height={xx ? "28px" : "50px"}
          fontSize={xx ? "12px" : "16px"}
          onClick={onApprove}
          disabled={unlockLoading || toAmountLoading}
        >
          {unlockLoading ? "Approving Tokens" : "Approve Tokens"}
          {unlockLoading && <CircularProgress size={25} style={{ marginLeft: "10px" }} />}
        </Button>
      );
    } else {
      return (
        <Button
          type={"primary"}
          width={"100%"}
          height={xx ? "28px" : "50px"}
          fontSize={xx ? "12px" : "16px"}
          onClick={onTransfer}
          disabled={!transferButtonEnabled}
        >
          {loading ? "Bridging Tokens" : "Bridge Tokens"}
          {loading && <CircularProgress size={25} style={{ marginLeft: "10px" }} />}
        </Button>
      );
    }
  };

  return (
    <StyledContainer>
      <Box display={"flex"} alignItems={"center"}>
        <Box
          fontSize={xs ? "calc(100vw / 412 * 20)" : "36px"}
          fontWeight={"bold"}
          mr={xs ? "8px" : "19px"}
        >
          Bridge
        </Box>
        <Box
          display={"flex"}
          minWidth={xs ? "23px" : "40px"}
          minHeight={xs ? "23px" : "40px"}
          maxWidth={xs ? "23px" : "40px"}
          maxHeight={xs ? "23px" : "40px"}
        >
          <img src={"/icons/bridge.png"} width={"100%"} height={"100%"} alt={""} />
        </Box>
      </Box>
      <Field>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          flexDirection={md ? "column" : "row"}
          mt={"32px"}
        >
          <Panel
            width={md ? "100%" : "calc(50% - 35px)"}
            maxWidth={md ? "100%" : "647px"}
            justifyContent={"unset"}
            padding={
              md ? (xx ? "25px 20px 30px 20px" : "21px 26px 41px 30px") : "21px 26px 113px 30px"
            }
            fontSize={"18px"}
          >
            <Box display={"flex"} alignItems={"center"}>
              <Box fontSize={xx ? "17px" : "18px"}>Bridge from</Box>
              <DropDown
                value={fromChainID}
                setValue={fromChainChanged}
                data={chains}
                width={xx ? "83px" : "100px"}
                height={xx ? "28px" : "33px"}
                fontSize={xx ? "14px" : "18px"}
                padding={xx ? "6px 0 4px 20px" : "6px 22px 6px 22px"}
              />
            </Box>
            <Box mt={xx ? "24px" : "35px"} fontSize={xx ? "13px" : "18px"}>
              Bridge your tokens from one network to another.
            </Box>
            <InputPanel mt={xx ? "23px" : "44px"}>
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                width={"100%"}
                style={{ cursor: "pointer" }}
              >
                <Box display={"flex"} alignItems={"center"}>
                  <Box
                    display={"flex"}
                    minWidth={xx ? "25px" : "29px"}
                    maxWidth={xx ? "25px" : "29px"}
                    minHeight={xx ? "25px" : "29px"}
                    maxHeight={xx ? "25px" : "29px"}
                  >
                    <img src={"/logo.png"} width={"100%"} height={"100%"} />
                  </Box>
                  <Box ml={"7px"} fontSize={xx ? "14px" : "16px"}>
                    Grove
                  </Box>
                  <Box ml={"9px"} fontSize={xx ? "14px" : "16px"}>
                    <AiFillCaretDown />
                  </Box>
                </Box>
                <Box display={"flex"} alignItems={"center"}>
                  {fromToken ? (
                    <Box
                      display="flex"
                      as="a"
                      href={`${getExplorerUrl(fromToken?.chainId)}/address/${fromToken?.address}`}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      <Box
                        display={"flex"}
                        minWidth={"16px"}
                        minHeight={"16px"}
                        maxWidth={"16px"}
                        maxHeight={"16px"}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={CHAIN_ICONS[fromToken?.chainId ?? 56]} width="15" alt="" />
                      </Box>
                      <Box ml={"5px"} fontSize={"11px"}>
                        {getAccountString(fromToken.address)}
                      </Box>
                    </Box>
                  ) : (
                    <Skeleton width={80} height={28} />
                  )}
                </Box>
              </Box>
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                mt={"15px"}
              >
                <input
                  type={"number"}
                  placeholder={"0.0"}
                  value={amountInput}
                  onKeyPress={(e) => {
                    if (e.key === ".") {
                      if (e.target.value.includes(".")) {
                        e.preventDefault();
                      }
                    } else if (Number.isNaN(Number(e.key))) {
                      e.preventDefault();
                    }
                  }}
                  onKeyUp={delayedSetAmount}
                  onChange={(event) => {
                    setPercent(0);
                    setAmountInput(event.target.value);
                  }}
                />
                <DropDown
                  data={percents}
                  value={percent}
                  setValue={onPercentSelected}
                  width={xx ? "66px" : "82px"}
                  height={xx ? "28px" : "33px"}
                  center
                  padding={xx ? "6px 18px 4px 21px" : "6px 24px"}
                  fontSize={xx ? "14px" : "18px"}
                />
              </Box>
            </InputPanel>
            {account && (
              <Box display="flex" justifyContent="end" fontSize={xx ? "17px" : "18px"} mt="5px">
                <Box mr="5px">Balance: </Box>
                {balanceLoading ? (
                  <Skeleton width={80} />
                ) : (
                  <Box>{formatValue(fromBalance, fromToken?.decimals)}</Box>
                )}
              </Box>
            )}
          </Panel>
          <Box display={"flex"} my={md ? "22px" : 0}>
            <img src={md ? "icons/switchdown.png" : "/icons/switchright.png"} />
          </Box>
          <Box width={md ? "100%" : "calc(50% - 35px)"} maxWidth={md ? "100%" : "647px"}>
            <Panel
              width={"100%"}
              justifyContent={"unset"}
              padding={xx ? "25px 20px 30px 20px" : "21px 26px 41px 30px"}
              fontSize={"18px"}
            >
              <Box display={"flex"} alignItems={"center"}>
                <Box fontSize={xx ? "17px" : "18px"}>Bridge to</Box>
                <DropDown
                  value={toChainID}
                  setValue={toChainChanged}
                  data={chains}
                  width={xx ? "83px" : "100px"}
                  height={xx ? "28px" : "33px"}
                  fontSize={xx ? "14px" : "18px"}
                  padding={xx ? "6px 0 4px 20px" : "6px 22px 6px 22px"}
                />
              </Box>
              <Box mt={xx ? "24px" : "35px"} fontSize={xx ? "13px" : "18px"}>
                Bridge your tokens from one network to another.
              </Box>
              <InputPanel mt={xx ? "23px" : "44px"}>
                <Box
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  width={"100%"}
                  style={{ cursor: "pointer" }}
                >
                  <Box display={"flex"} alignItems={"center"}>
                    <Box
                      display={"flex"}
                      minWidth={xx ? "25px" : "29px"}
                      maxWidth={xx ? "25px" : "29px"}
                      minHeight={xx ? "25px" : "29px"}
                      maxHeight={xx ? "25px" : "29px"}
                    >
                      <img src={"/logo.png"} width={"100%"} height={"100%"} />
                    </Box>
                    <Box ml={"7px"} fontSize={xx ? "14px" : "16px"}>
                      Grove
                    </Box>
                    <Box ml={"9px"} fontSize={xx ? "14px" : "16px"}>
                      <AiFillCaretDown />
                    </Box>
                  </Box>
                  <Box display={"flex"} alignItems={"center"}>
                    {toToken ? (
                      <Box
                        display="flex"
                        as="a"
                        href={`${getExplorerUrl(toToken?.chainId)}/address/${toToken?.address}`}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        <Box
                          display={"flex"}
                          minWidth={"16px"}
                          minHeight={"16px"}
                          maxWidth={"16px"}
                          maxHeight={"16px"}
                          style={{ cursor: "pointer" }}
                        >
                          <img src={CHAIN_ICONS[toToken?.chainId ?? 1]} width="15" alt="" />
                        </Box>
                        <Box ml={"5px"} fontSize={"11px"}>
                          {getAccountString(toToken.address)}
                        </Box>
                      </Box>
                    ) : (
                      <Skeleton width={80} height={28} />
                    )}
                  </Box>
                </Box>
                <Box
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  mt={"15px"}
                >
                  {toAmountLoading ? (
                    <Skeleton width={100} height={36} />
                  ) : (
                    <input
                      type={"text"}
                      placeholder={"0.0"}
                      value={formatValue(toAmount, toToken?.decimals)}
                      disabled
                    />
                  )}
                </Box>
              </InputPanel>
              {account && (
                <Box display="flex" justifyContent="end" fontSize={xx ? "17px" : "18px"} mt="5px">
                  <Box mr="5px">Balance: </Box>
                  {toBalanceLoading ? (
                    <Skeleton width={80} />
                  ) : (
                    <Box>{formatValue(toBalance, toToken?.decimals)}</Box>
                  )}
                </Box>
              )}
            </Panel>
            <Box mt={xx ? "30px" : "22px"}>{renderActions()}</Box>
          </Box>
        </Box>
        <Box mt={sm ? "40px" : "50px"}>
          <Box fontSize={xs ? "calc(100vw / 412 * 20)" : "24px"} fontWeight={"bold"}>
            Current price
          </Box>
          <Box display={"flex"} justifyContent={"space-between"} mt={xs ? "20px" : "36px"}>
            <Panel
              width={sm ? "calc(50% - 10px)" : "calc(50% - 35px)"}
              maxWidth={"647px"}
              padding={xx ? (xxs ? "20px 10px" : "30px 15px") : "50px 30px"}
            >
              <Box fontSize={xx ? (xxs ? "11px" : "14px") : "18px"}>GVR PRICE BNB</Box>
              <Box
                fontSize={xx ? (xxs ? "16px" : "24px") : "32px"}
                fontWeight={"600"}
                mt={xx ? (xxs ? "5px" : "10px") : "18px"}
              >
                {prices[56].detail}
              </Box>
              <Vector>
                <img src={"/icons/groveprice.png"} alt={""} />
              </Vector>
            </Panel>
            <Panel
              width={sm ? "calc(50% - 10px)" : "calc(50% - 35px)"}
              maxWidth={"647px"}
              padding={xx ? (xxs ? "20px 10px" : "30px 15px") : "50px 30px"}
            >
              <Box fontSize={xx ? (xxs ? "11px" : "14px") : "18px"}>GVR PRICE ETH</Box>
              <Box
                fontSize={xx ? (xxs ? "16px" : "24px") : "32px"}
                fontWeight={"600"}
                mt={xx ? (xxs ? "5px" : "10px") : "18px"}
              >
                {prices[1].detail}
              </Box>
              <Vector>
                <img src={"/icons/ethinfo.png"} alt={""} />
              </Vector>
            </Panel>
          </Box>
        </Box>

        <BridgeHistory />
      </Field>
      <BridgeLoadingModal />
    </StyledContainer>
  );
};

const Vector = styled(Box)`
  position: absolute;
  right: 19px;
  top: 20px;
  @media screen and (max-width: 600px) {
    transform: scale(0.7);
    right: 0px;
    top: 0px;
  }

  @media screen and (max-width: 600px) {
    transform: scale(0.5);
    right: 0px;
    top: -5px;
  }
`;

const InputPanel = styled(Box)`
  background: #181a1c;
  border: 2px solid #b7b7b7;
  border-radius: 10px;
  padding: 14px 27px 13px 25px;
  > div > input {
    font-size: 24px;
    background: transparent;
    border: none;
    width: 100%;
    font-family: "Montserrat";
  }
  @media screen and (max-width: 600px) {
    padding: 16px 20px 13px 20px;
  }
`;

const Field = styled(Box)`
  width: 100%;
  max-width: 1400px;
`;
const Panel = styled(Box)`
  background: linear-gradient(to bottom, rgba(0, 255, 235, 0.2), rgba(0, 0, 0, 0));
  border: 2px solid rgb(50, 54, 83);
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0px 0px 0px 25px;
`;

const StyledContainer = styled(Box)`
  color: white;
  font-weight: 500;
  padding: 56px 46px 100px 46px;
  height: fit-content;
  width: 100%;
  @media screen and (max-width: 800px) {
    width: 100%;
    margin: 0 auto;
    padding: 56px 25px 100px 25px;
  }
  @media screen and (max-width: 680px) {
    margin: 0 auto;
    padding: 40px 25px 50px 25px;
  }
`;

export default Bridge;
