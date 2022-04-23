import React, { useState } from "react";
import { Alert, Box, Dialog } from "@mui/material";
import { AiOutlineClose } from "react-icons/ai";
import styled from "styled-components";

import { useBridgeContext } from "../../../context/BridgeContext";
import { useBridgeDirection } from "../../../hooks/useBridgeDirection";
import { switchNetwork } from "../../../utils/functions";
import { getNetworkLabel } from "../../../utils/helper";

export const NeedsConfirmationModal = ({
  setNeedsConfirmation,
  setMessage,
}) => {
  const { foreignChainId } = useBridgeDirection();
  const { fromToken, toToken, setTxHash } = useBridgeContext();
  const toUnit =
    (toToken !== undefined && toToken?.symbol) ||
    (fromToken !== undefined && fromToken?.symbol);

  const [isOpen, setOpen] = useState(true);

  const onClose = () => {
    setNeedsConfirmation(false);
    setTxHash();
    setMessage();
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogPanel>
        <DialogHeader p={4}>
          <Box>Claim Your Tokens</Box>
          <AiOutlineClose cursor={"pointer"} onClick={onClose} />
        </DialogHeader>
        <DialogBody px={4} py={0}>
          <Box display={"flex"} alignItems="center" flexDirection="column">
            <Box width="100%" fontSize="sm">
              <Box as="span">Please switch the network in your wallet to </Box>
              <Box
                as="span"
                style={{cursor: "pointer"}}
                onClick={() => {
                  switchNetwork(foreignChainId);
                }}
              >
                {getNetworkLabel(foreignChainId)}
              </Box>
            </Box>
            <Box
              display={"flex"}
              alignItems="center"
              flexDirection="column"
              width="100%"
              mt={2}
              mb={6}
            >
              <Alert severity="info">
                After you switch networks, you will complete a second
                transaction on {getNetworkLabel(foreignChainId)} to claim your{" "}
                {toUnit} tokens.
              </Alert>
            </Box>
          </Box>
        </DialogBody>
      </DialogPanel>
    </Dialog>
  );
};

const DialogBody = styled(Box)`
  padding: 15px 20px 30px 20px;
`;

const DialogHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  padding: 20px 20px 17px 20px;
  font-size: 18px;
  font-weight: 600;
  @media screen and (max-width: 450px) {
    font-size: 17px;
  }
`;

const DialogPanel = styled(Box)`
  width: calc(100vw - 40px);
  max-width: 620px;
  color: white;
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 235, 0.2),
    rgba(0, 0, 0, 0)
  );
  border-radius: 10px;
  border: 1px solid rgb(57, 59, 85);
`;
