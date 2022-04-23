import React, { useCallback, useState } from "react";
import { AiOutlineClose, AiOutlineCheck } from "react-icons/ai";
import { Box, useMediaQuery } from "@mui/material";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import styled from "styled-components";

import { useWeb3Context } from "../../../context/web3Context";
import { useBridgeDirection } from "../../../hooks/useBridgeDirection";
import { useClaim } from "../../../hooks/useClaim";
import { isRevertedError, TOKENS_CLAIMED } from "../../../lib/bridge/amb";
import { formatValue, getExplorerUrl, handleWalletError } from "../../../utils/helper";
import { switchNetwork } from "../../../utils/functions";
import Button from "../../../components/Button";
import { AddToMetamask } from "./AddToMetamask";

const shortenHash = (hash) => `${hash.slice(0, 6)}...${hash.slice(hash.length - 4, hash.length)}`;

const networkTags = {
  1: <img src="/icons/eth.png" width="15" alt="Ethereum" />,
  4: <img src="/icons/eth.png" width="15" alt="Rinkeby" />,
  56: <img src="/icons/binance.png" width="15" alt="BSC" />,
  97: <img src="/icons/binance.png" width="15" alt="BSC" />,
};

const getNetworkTag = (chainId) => networkTags[chainId];

export const HistoryItem = ({
  data: {
    user,
    chainId,
    timestamp,
    sendingTx,
    receivingTx: inputReceivingTx,
    amount,
    toToken,
    message,
    status,
  },
  handleClaimError,
}) => {
  const { chainID } = useWeb3Context();
  const { getBridgeChainId } = useBridgeDirection();
  const bridgeChainId = getBridgeChainId(chainId);

  const timestampString = new Date(parseInt(timestamp, 10) * 1000).toLocaleTimeString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sm = useMediaQuery("(max-width : 750px)");

  const showError = useCallback((msg) => {
    if (msg) toast.error(msg);
  }, []);

  const { claim, executing, executionTx } = useClaim();
  const [claiming, setClaiming] = useState(false);
  const receivingTx = executionTx || inputReceivingTx;
  const claimed = !!receivingTx;
  const failed = !!inputReceivingTx && status === false;

  const showAlreadyClaimedModal = useCallback(() => {
    handleClaimError(toToken);
  }, [toToken, handleClaimError]);

  const claimTokens = useCallback(async () => {
    try {
      setClaiming(true);
      await claim(sendingTx, message);
    } catch (claimError) {
      console.error({ claimError });
      if (claimError.message === TOKENS_CLAIMED || isRevertedError(claimError)) {
        showAlreadyClaimedModal();
      } else {
        handleWalletError(claimError, showError);
      }
    } finally {
      setClaiming(false);
    }
  }, [claim, sendingTx, message, showError, showAlreadyClaimedModal]);

  return (
    <History display={sm ? "block" : "flex"} height="auto">
      <Box
        display={"grid"}
        height={sm ? "fit-content" : "auto"}
        alignItems="center"
        gridTemplateColumns={{
          sm: "1fr",
          md: "0.5fr 0.3fr 0.75fr 0.75fr 0.5fr 0.5fr",
          lg: "1fr 0.3fr 0.9fr 0.9fr 0.5fr 0.5fr",
        }}
        width="100%"
        fontSize={"15px"}
        px={"10px"}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display={{ xs: "inline-block", md: "none" }} color="greyText">
            Date
          </Box>
          <Box my="auto">{timestampString}</Box>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display={{ xs: "inline-block", md: "none" }} color="greyText">
            Direction
          </Box>
          <Box
            display="flex"
            px="2px"
            alignItems="center"
            mx={{ xs: "none", md: "auto" }}
            style={{ gridGap: "2px" }}
          >
            {getNetworkTag(chainId)}
            {getNetworkTag(bridgeChainId)}
          </Box>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "space-between", md: "center" }}
        >
          <Box display={{ xs: "inline-block", md: "none" }} color="greyText">
            Sending Tx
          </Box>
          <Box
            as="a"
            href={`${getExplorerUrl(chainId)}/tx/${sendingTx}`}
            rel="noreferrer noopener"
            target="_blank"
          >
            {shortenHash(sendingTx)}
          </Box>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "space-between", md: "center" }}
        >
          <Box display={{ xs: "inline-block", md: "none" }} color="greyText">
            Receiving Tx
          </Box>
          {receivingTx ? (
            <Box
              as="a"
              href={`${getExplorerUrl(bridgeChainId)}/tx/${receivingTx}`}
              rel="noreferrer noopener"
              target="_blank"
            >
              {shortenHash(receivingTx)}
            </Box>
          ) : (
            <Box />
          )}
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "space-between", md: "flex-end" }}
          pr={{ xs: 0, md: 2 }}
        >
          <Box display={{ xs: "inline-block", md: "none" }} color="greyText">
            Amount
          </Box>
          <Box display="flex">
            <Box my="auto" textAlign="right">
              {`${formatValue(BigNumber.from(amount), toToken.decimals)}`}
            </Box>
            <AddToMetamask token={toToken} style={{ marginLeft: "2px", cursor: "pointer" }} />
          </Box>
        </Box>
        {claimed ? (
          <Box display="flex" alignItems="center" justifyContent={{ xs: "center", md: "flex-end" }}>
            {failed ? <AiOutlineClose pb="0.1rem" /> : <AiOutlineCheck pb="0.1rem" />}
            <Box ml="0.25rem" color={failed ? "red.500" : "blue.500"}>
              {failed ? "Failed" : "Claimed"}
            </Box>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" justifyContent={{ xs: "center", md: "flex-end" }}>
            <Button
              type={"confirm"}
              width={"70px"}
              height={"30px"}
              fontSize={"16px"}
              onClick={() => {
                chainID === bridgeChainId ? claimTokens() : switchNetwork(bridgeChainId);
              }}
              disabled={claiming || executing}
            >
              {chainID === bridgeChainId ? `Claim` : `Switch`}
            </Button>
          </Box>
        )}
      </Box>
    </History>
  );
};

const History = styled(Box)`
  width: 100%;
  height: 63px;
  background: rgba(1, 5, 30, 0.2);
  border: 2px solid rgb(51, 83, 98);
  border-radius: 10px;
  margin: 10px 0;
  padding: 10px;
`;
