import React from "react";
import { Box, Dialog, useMediaQuery, CircularProgress } from "@mui/material";
import styled from "styled-components";
import { AiOutlineCheck } from "react-icons/ai";

import { useWeb3Context } from "../../../context/web3Context";
import { useBridgeDirection } from "../../../hooks/useBridgeDirection";

const getTransactionString = (hash) => {
  if (!hash) return "here";
  const len = hash.length;
  return `${hash.substr(0, 6)}...${hash.substr(len - 4, len - 1)}`;
};

export const LoadingModal = ({ loadingText, txHash, chainId }) => {
  const { getMonitorUrl } = useBridgeDirection();
  const { chainID: providerChainId } = useWeb3Context();

  const sm = useMediaQuery("(max-width : 450px)");
  return (
    <Dialog open>
      <DialogPanel>
        {loadingText ? (
          <Box
            display={"flex"}
            alignItems={sm ? "stretch" : "center"}
            flexDirection={sm ? "column" : "row"}
          >
            <Box
              display={"flex"}
              width="3.25rem"
              height="3.25rem"
              alignItems={"center"}
              justifyContent="center"
            >
              <CircularProgress />
              <AiOutlineCheck style={{ position: "absolute" }} />
            </Box>
            <Box
              display="flex"
              flex={1}
              flexDirection="column"
              align={sm ? "flex-start" : "cetner"}
              mt="5px"
            >
              <Box textAlign="center">{`${loadingText}...`}</Box>
              <Box color="grey" textAlign="center">
                {"Monitor at explorer "}
                <a
                  href={getMonitorUrl(chainId || providerChainId, txHash)}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ textDecoration: "underline" }}
                >
                  {getTransactionString(txHash)}
                </a>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>Loading ...</Box>
        )}
      </DialogPanel>
    </Dialog>
  );
};

const DialogPanel = styled(Box)`
  width: calc(100vw - 40px);
  max-width: 500px;
  color: white;
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 235, 0.2),
    rgba(0, 0, 0, 0)
  );
  padding: 1rem 1.5rem;
  border-radius: 2rem;
  border: 1px solid rgb(57, 59, 85);
`;
