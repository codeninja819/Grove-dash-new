/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { Box, useMediaQuery, Skeleton } from "@mui/material";
import { ethers } from "ethers";
import { AiOutlineCalculator, AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import styled from "styled-components";

import { GROVE_LOCK, GROVE_UNLOCK } from "../../abis/address";
import Button from "../../components/Button";
import ROIModal from "../../components/ROIModal";
import StakingModal from "../../components/StakingModal";
import { useAddress } from "../../context/web3Context";
import { useWeb3Context } from "../../context/web3Context";
import useLockInfo from "../../hooks/useLockInfo";
import useTokenInfo from "../../hooks/useTokenInfo";
import { getLockContract, getTokenContract, getUnlockContract } from "../../utils/contracts";
import { figureError } from "../../utils/functions";

const lockcompound = [
  [38.65 / 32.69, 38.53 / 32.69, 38.39 / 32.69, 38.07 / 32.69],
  [55.75 / 44.33, 55.5 / 44.33, 55.21 / 44.33, 54.56 / 44.33],
  [64.84 / 50.01, 64.5 / 50.01, 64.11 / 50.01, 63.25 / 50.01],
  [67.6 / 51.68, 67.24 / 51.68, 66.82 / 51.68, 65.88 / 51.68],
];

const Staking = ({ setNotification }) => {
  const { lockinfo, lockallow, unlockallow, accountlockinfo, fetchAccountLockData, fetchLockData, fetchAllowance } = useLockInfo();

  const { price, balance, fetchAccountTokenInfo } = useTokenInfo();

  const { connect, provider, chainID } = useWeb3Context();

  const account = useAddress();

  const sm = useMediaQuery("(max-width : 800px)");
  const xs = useMediaQuery("(max-width : 450px)");

  const [detailopen, setDetailOpen] = useState([]);
  const [open, setOpen] = useState(false);
  const [roiopen, setROIOpen] = useState(false);
  const [type, setType] = useState(1);
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState(0);
  const [curindex, setCurIndex] = useState(0);
  const [maxpressed, setMaxPressed] = useState(false);

  function numberWithCommas(x) {
    if (!x) return;
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function onConnect() {
    connect().then((msg) => {
      if (msg.type === "error") {
        setNotification(msg);
      }
    });
  }

  const onApproveContract = async (type, address) => {
    setPending(true);
    try {
      const tokenContract = getTokenContract(chainID, provider.getSigner());
      const estimateGas = await tokenContract.estimateGas.approve(
        type === 1 ? GROVE_UNLOCK[chainID] : GROVE_LOCK[chainID],
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
      console.log(estimateGas.toString());
      if (estimateGas / 1 === 0) {
        setNotification({
          type: "error",
          title: "Error",
          detail: "Insufficient funds",
        });
        setPending(false);
        return;
      }
      const tx = {
        gasLimit: estimateGas.toString(),
      };
      const approvetx = await tokenContract.approve(
        type === 1 ? GROVE_UNLOCK[chainID] : GROVE_LOCK[chainID],
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        tx
      );
      await approvetx.wait();
      fetchAllowance();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  const onConfirm = async () => {
    setPending(true);
    try {
      let ttx, estimateGas;
      if (curindex === 0) {
        const unLockContract = getUnlockContract(chainID, provider.getSigner());
        if (type === 1) {
          estimateGas = await unLockContract.estimateGas.deposit(maxpressed ? balance : ethers.utils.parseEther(amount), {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
          });
          console.log(estimateGas.toString(), "Unlock", type, amount);
          if (estimateGas / 1 === 0) {
            setNotification({
              type: "error",
              title: "Error",
              detail: "Insufficient funds",
            });
            setPending(false);
            return;
          }
          const tx = {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
            gasLimit: estimateGas.toString(),
          };
          ttx = await unLockContract.deposit(maxpressed ? balance : ethers.utils.parseEther(amount), tx);
        } else {
          estimateGas = await unLockContract.estimateGas.withdraw(maxpressed ? accountlockinfo[curindex].stakedAmount : ethers.utils.parseEther(amount), {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
          });
          console.log(estimateGas.toString(), "Unlock", type, amount);
          if (estimateGas / 1 === 0) {
            setNotification({
              type: "error",
              title: "Error",
              detail: "Insufficient funds",
            });
            setPending(false);
            return;
          }
          const tx = {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
            gasLimit: Math.ceil(estimateGas * 1.2),
          };
          ttx = await unLockContract.withdraw(maxpressed ? accountlockinfo[curindex].stakedAmount : ethers.utils.parseEther(amount), tx);
        }
      } else {
        const LockContract = getLockContract(chainID, provider.getSigner());
        if (type === 1) {
          estimateGas = await LockContract.estimateGas.deposit(maxpressed ? balance : ethers.utils.parseEther(amount), curindex - 1, {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
          });
          console.log(estimateGas.toString(), "Lock", type, amount, curindex - 1);
          if (estimateGas / 1 === 0) {
            setNotification({
              type: "error",
              title: "Error",
              detail: "Insufficient funds",
            });
            setPending(false);
            return;
          }
          const tx = {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
            gasLimit: Math.ceil(estimateGas * 1.2),
          };
          ttx = await LockContract.deposit(maxpressed ? balance : ethers.utils.parseEther(amount), curindex - 1, tx);
        } else {
          estimateGas = await LockContract.estimateGas.withdraw(maxpressed ? accountlockinfo[curindex].stakedAmount : ethers.utils.parseEther(amount), curindex - 1, {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
          });
          console.log(estimateGas.toString(), "Lock", type, amount, curindex - 1);
          if (estimateGas / 1 === 0) {
            setNotification({
              type: "error",
              title: "Error",
              detail: "Insufficient funds",
            });
            setPending(false);
            return;
          }
          const tx = {
            value: chainID === 56 ? 0 : lockinfo[curindex].performanceFee,
            gasLimit: estimateGas.toString(),
          };
          ttx = await LockContract.withdraw(maxpressed ? accountlockinfo[curindex].stakedAmount : ethers.utils.parseEther(amount), curindex - 1, tx);
        }
      }
      await ttx.wait();
      fetchAccountLockData();
      fetchLockData();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  const onCompoundReward = async (i) => {
    setPending(true);
    try {
      let harvestTx, estimateGas;
      console.log(lockinfo, i);

      if (i === 0) {
        const unLockContract = getUnlockContract(chainID, provider.getSigner());
        estimateGas = await unLockContract.estimateGas.compoundReward({
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Unlock");
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };

        harvestTx = await unLockContract.compoundReward(tx);
      } else {
        const LockContract = getLockContract(chainID, provider.getSigner());
        estimateGas = await LockContract.estimateGas.compoundReward(i - 1, {
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Lock", i - 1);
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };
        harvestTx = await LockContract.compoundReward(i - 1, tx);
      }
      await harvestTx.wait();
      fetchAccountLockData();
      fetchLockData();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  const onCompoundReflection = async (i) => {
    setPending(true);
    try {
      let harvestTx, estimateGas;
      if (i === 0) {
        const unLockContract = getUnlockContract(chainID, provider.getSigner());
        estimateGas = await unLockContract.estimateGas.compoundDividend({
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Unlock");
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };

        harvestTx = await unLockContract.compoundDividend(tx);
      } else {
        const LockContract = getLockContract(chainID, provider.getSigner());
        estimateGas = await LockContract.estimateGas.compoundDividend(i - 1, {
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Lock", i - 1);
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };
        harvestTx = await LockContract.compoundDividend(i - 1, tx);
      }
      await harvestTx.wait();
      fetchAccountLockData();
      fetchLockData();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  const onHarvestReward = async (i) => {
    setPending(true);
    try {
      let harvestTx, estimateGas;
      if (i === 0) {
        const unLockContract = getUnlockContract(chainID, provider.getSigner());
        estimateGas = await unLockContract.estimateGas.claimReward({
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Unlock");
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };

        harvestTx = await unLockContract.claimReward(tx);
      } else {
        const LockContract = getLockContract(chainID, provider.getSigner());
        estimateGas = await LockContract.estimateGas.claimReward(i - 1, {
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Lock", i - 1);
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };
        harvestTx = await LockContract.claimReward(i - 1, tx);
      }
      await harvestTx.wait();
      fetchAccountLockData();
      fetchLockData();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  const onHarvestReflection = async (i) => {
    setPending(true);
    try {
      let harvestTx, estimateGas;
      if (i === 0) {
        const unLockContract = getUnlockContract(chainID, provider.getSigner());
        estimateGas = await unLockContract.estimateGas.claimDividend({
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Unlock");
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };

        harvestTx = await unLockContract.claimDividend(tx);
      } else {
        const LockContract = getLockContract(chainID, provider.getSigner());
        estimateGas = await LockContract.estimateGas.claimDividend(i - 1, {
          value: lockinfo[i].performanceFee,
        });
        console.log(estimateGas.toString(), "Lock", i - 1);
        if (estimateGas / 1 === 0) {
          setNotification({
            type: "error",
            title: "Error",
            detail: "Insufficient funds",
          });
          setPending(false);
          return;
        }
        const tx = {
          gasLimit: Math.ceil(estimateGas * 1.2),
          value: lockinfo[i].performanceFee,
        };
        harvestTx = await LockContract.claimDividend(i - 1, tx);
      }
      await harvestTx.wait();
      fetchAccountLockData();
      fetchLockData();
    } catch (error) {
      console.log(error);
      figureError(error, setNotification);
    }
    setPending(false);
  };

  return (
    <StyledContainer>
      <StakingModal
        open={open}
        setOpen={setOpen}
        balance={type === 1 ? balance / Math.pow(10, 18) : accountlockinfo[curindex].stakedAmount / Math.pow(10, 18)}
        type={type}
        amount={amount}
        setAmount={setAmount}
        maxpressed={maxpressed}
        setMaxPressed={setMaxPressed}
        onClick={() => onConfirm()}
        pending={pending}
        price={price[chainID]}
      />
      <ROIModal
        open={roiopen}
        setOpen={setROIOpen}
        price={price[chainID]}
        balance={balance / Math.pow(10, 18)}
        rate={lockinfo[curindex].rate}
        compound={lockcompound[curindex]}
      />
      <Box display={"flex"} alignItems={"center"} margin={sm ? "18px 0 12px 0" : "24px 21px 12px  21px"}>
        <Box fontSize={xs ? "20px" : "36px"} fontWeight={"bold"} mr={xs ? "8px" : "19px"}>
          Staking
        </Box>
        <Box display={"flex"} minWidth={xs ? "23px" : "40px"} minHeight={xs ? "23px" : "40px"} maxWidth={xs ? "23px" : "40px"} maxHeight={xs ? "23px" : "40px"}>
          <img src={"/icons/staking.png"} width={"100%"} height={"100%"} alt={""} />
        </Box>
      </Box>
      <PoolPanel>
        {lockinfo.map((data, i) => {
          return (
            <Pool key={i}>
              <Box display={"flex"} justifyContent={"space-between"}>
                <Box mt={"10px"} fontSize={xs ? "12px" : "18px"}>
                  <Box fontSize={xs ? "13px" : "16px"}>Staking Pool: Earn GVR / Stake GVR</Box>
                  <Box
                    mt={xs ? "9px" : "18px"}
                    fontSize={xs ? "17px" : "32px"}
                    fontWeight={"600"}
                    style={{ cursor: "pointer" }}
                    display={"flex"}
                    alignItems={"center"}
                    onClick={() => {
                      setROIOpen(true);
                      setCurIndex(i);
                    }}
                  >
                    <Box display={"flex"} alignItems={"center"} lineHeight={"normal"}>
                      {data.rate !== undefined ? (
                        <Box>{Number(data.rate).toFixed(2)}%</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "60px" : "100px"} style={{ transform: "unset" }} />
                      )}
                      <Box mx={xs ? "5px" : "10px"}>APR</Box>
                      <Box>
                        <AiOutlineCalculator />
                      </Box>
                    </Box>
                  </Box>
                  <Box mt={xs ? "4px" : "16px"}>{i === 0 ? "Lock Duration: Flexible" : `Lock Duration: ${i === 1 ? 60 : i === 2 ? 90 : 180} Days`}</Box>
                  <Box mt={xs ? "10px" : "16px"} display={"flex"} lineHeight={"normal"}>
                    <Box mr={xs ? "5px" : "10px"}>Deposit Fee: </Box>
                    {data.depositFee !== undefined ? (
                      <Box>{Number(data.depositFee).toFixed(2)}%</Box>
                    ) : (
                      <Skeleton variant={"text"} width={xs ? "25px" : "50px"} style={{ transform: "unset" }} />
                    )}
                  </Box>
                  <Box display={"flex"} lineHeight={"normal"}>
                    <Box mr={xs ? "5px" : "10px"}>Withdraw Fee: </Box>
                    {data.withdrawFee !== undefined ? (
                      <Box>{Number(data.withdrawFee).toFixed(2)}%</Box>
                    ) : (
                      <Skeleton variant={"text"} width={xs ? "25px" : "50px"} style={{ transform: "unset" }} />
                    )}
                  </Box>
                </Box>
                <Box display={"flex"} flexDirection={"column"} alignItems={"flex-end"}>
                  <Box
                    display={"flex"}
                    minWidth={xs ? "24px" : "34px"}
                    minHeight={xs ? "25px" : "34px"}
                    maxWidth={xs ? "24px" : "34px"}
                    maxHeight={xs ? "25px" : "34px"}
                    bgcolor={"white"}
                    borderRadius={"50%"}
                    zIndex={1}
                  >
                    <img src={"/logo.png"} />
                  </Box>
                  <Box
                    display={"flex"}
                    borderRadius={"50%"}
                    border={"1px solid white"}
                    mt={"-13px"}
                    mr={"8px"}
                    minWidth={xs ? "36px" : "51px"}
                    minHeight={xs ? "36px" : "52px"}
                    maxWidth={xs ? "36px" : "51px"}
                    maxHeight={xs ? "36px" : "52px"}
                  >
                    <img src={"/logo.png"} />
                  </Box>
                </Box>
              </Box>
              <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"} mt={xs ? "18px" : "24px"}>
                <Box>
                  <Box fontSize={xs ? "12px" : "18px"}>GVR Earned</Box>
                  <Box fontSize={xs ? "17px" : "32px"} fontWeight={600} mt={xs ? "-2px" : "4px"} lineHeight={"normal"}>
                    {account ? (
                      accountlockinfo[i].pendingReward !== undefined ? (
                        <Box>{Number(accountlockinfo[i].pendingReward).toFixed(3)}</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "70px" : "120px"} style={{ transform: "unset" }} />
                      )
                    ) : (
                      "0.000"
                    )}
                  </Box>
                  <Box mt={xs ? "-2px" : "4px"} lineHeight={"normal"} fontSize={xs ? "12px" : "18px"}>
                    {account ? (
                      !isNaN(accountlockinfo[i].pendingReward * price[chainID]) ? (
                        <Box>${Number(accountlockinfo[i].pendingReward * price[chainID]).toFixed(3)}</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "30px" : "60px"} style={{ transform: "unset" }} />
                      )
                    ) : (
                      "$0.000"
                    )}
                  </Box>
                </Box>
                <Box>
                  <Button
                    type={"secondary"}
                    width={xs ? "101px" : "142px"}
                    height={xs ? "28px" : "50px"}
                    fontSize={xs ? "12px" : "16px"}
                    disabled={pending || !accountlockinfo[i].pendingReward || !lockinfo[i].performanceFee}
                    onClick={() => onCompoundReward(i)}
                  >
                    Compound
                  </Button>
                  {accountlockinfo[i].available / 1 ? (
                    <>
                      <Box mt={xs ? "23px" : "30px"} />
                      <Button
                        type={"secondary"}
                        width={xs ? "101px" : "142px"}
                        height={xs ? "28px" : "50px"}
                        fontSize={xs ? "12px" : "16px"}
                        disabled={pending || !accountlockinfo[i].pendingReward || !lockinfo[i].performanceFee}
                        onClick={() => onHarvestReward(i)}
                      >
                        Harvest
                      </Button>
                    </>
                  ) : (
                    ""
                  )}
                </Box>
              </Box>

              <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"} mt={xs ? "30px" : "42px"}>
                <Box>
                  <Box fontSize={xs ? "12px" : "18px"}>GVR Reflected</Box>
                  <Box fontSize={xs ? "17px" : "32px"} fontWeight={600} mt={xs ? "-2px" : "4px"} lineHeight={"normal"}>
                    {account ? (
                      accountlockinfo[i].pendingDividends !== undefined ? (
                        <Box>{Number(accountlockinfo[i].pendingDividends).toFixed(3)}</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "70px" : "120px"} style={{ transform: "unset" }} />
                      )
                    ) : (
                      "0.000"
                    )}
                  </Box>
                  <Box mt={xs ? "-2px" : "4px"} lineHeight={"normal"} fontSize={xs ? "12px" : "18px"}>
                    {account ? (
                      !isNaN(accountlockinfo[i].pendingDividends * price[chainID]) ? (
                        <Box>${Number(accountlockinfo[i].pendingDividends * price[chainID]).toFixed(3)}</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "30px" : "60px"} style={{ transform: "unset" }} />
                      )
                    ) : (
                      "$0.000"
                    )}
                  </Box>
                </Box>
                <Box>
                  <Button
                    type={"secondary"}
                    width={xs ? "101px" : "142px"}
                    height={xs ? "28px" : "50px"}
                    fontSize={xs ? "12px" : "16px"}
                    disabled={pending || !accountlockinfo[i].pendingDividends || !lockinfo[i].performanceFee}
                    onClick={() => onCompoundReflection(i)}
                  >
                    Compound
                  </Button>
                  <Box mt={xs ? "23px" : "30px"} />
                  <Button
                    type={"secondary"}
                    width={xs ? "101px" : "142px"}
                    height={xs ? "28px" : "50px"}
                    fontSize={xs ? "12px" : "16px"}
                    disabled={pending || !accountlockinfo[i].pendingDividends || !lockinfo[i].performanceFee}
                    onClick={() => onHarvestReflection(i)}
                  >
                    Harvest
                  </Button>
                </Box>
              </Box>

              <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"} mt={xs ? "30px" : "42px"}>
                <Box>
                  <Box fontSize={xs ? "12px" : "18px"}>GVR Staked</Box>
                  <Box fontSize={xs ? "17px" : "32px"} fontWeight={600} mt={xs ? "-2px" : "4px"} lineHeight={"normal"}>
                    {account ? (
                      accountlockinfo[i].stakedAmount !== undefined ? (
                        <Box>{Number(accountlockinfo[i].stakedAmount / Math.pow(10, 18)).toFixed(3)}</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "70px" : "120px"} style={{ transform: "unset" }} />
                      )
                    ) : (
                      "0.000"
                    )}
                  </Box>
                  <Box mt={xs ? "-2px" : "4px"} lineHeight={"normal"} fontSize={xs ? "12px" : "18px"}>
                    {account ? (
                      !isNaN((accountlockinfo[i].stakedAmount / Math.pow(10, 18)) * price[chainID]) ? (
                        <Box>${Number((accountlockinfo[i].stakedAmount / Math.pow(10, 18)) * price[chainID]).toFixed(3)}</Box>
                      ) : (
                        <Skeleton variant={"text"} width={xs ? "30px" : "60px"} style={{ transform: "unset" }} />
                      )
                    ) : (
                      "$0.000"
                    )}
                  </Box>
                </Box>
                {!(i === 0 ? unlockallow : lockallow) && lockinfo[i].performanceFee ? (
                  <Box display={"flex"} justifyContent={"space-between"} width={xs ? "101px" : "142px"}>
                    <Button
                      type={"plus"}
                      width={xs ? "40px" : "55px"}
                      height={xs ? "40px" : "55px"}
                      fontSize={"28px"}
                      onClick={() => {
                        setOpen(true);
                        setType(1);
                        setCurIndex(i);
                        setAmount(0);
                      }}
                    >
                      +
                    </Button>
                    <Button
                      type={"minus"}
                      width={xs ? "40px" : "55px"}
                      height={xs ? "40px" : "55px"}
                      fontSize={"28px"}
                      onClick={() => {
                        setOpen(true);
                        setType(2);
                        setCurIndex(i);
                        setAmount(0);
                      }}
                    >
                      -
                    </Button>
                  </Box>
                ) : (
                  ""
                )}
              </Box>

              {(i === 0 ? unlockallow : lockallow) ? (
                <Box mt={"32px"} width={"100%"}>
                  <Button
                    width={"100%"}
                    height={xs ? "28px" : "50px"}
                    type={"primary"}
                    fontSize={xs ? "12px" : "16px"}
                    disabled={pending}
                    onClick={() => {
                      !account ? onConnect() : onApproveContract();
                    }}
                  >
                    {!account ? "Connect Wallet" : "Enable Contract"}
                  </Button>
                </Box>
              ) : (
                ""
              )}
              <Box
                display={"flex"}
                alignItems={"center"}
                fontSize={xs ? "12px" : "18px"}
                mt={"25px"}
                justifyContent={"center"}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  let temp = [...detailopen];
                  temp[i] = !temp[i];
                  setDetailOpen(temp);
                }}
              >
                <Box mr={"10px"}>Details</Box>
                <Box>{detailopen[i] ? <AiFillCaretUp /> : <AiFillCaretDown />}</Box>
              </Box>
              <Detail active={detailopen[i]}>
                <Box mt={xs ? "17px" : "36px"}>
                  <Box>Total Staked:</Box>
                  <Box>{numberWithCommas(Number(data.totalStaked ? data.totalStaked : 0).toFixed(0))}</Box>
                </Box>
                <Box width={xs ? "80px" : "142px"} fontWeight={400} mt={xs ? "17px" : "36px"}>
                  <Box>Ends In</Box>
                  <Box>{numberWithCommas(data.endsIn ? data.endsIn : 0)}</Box>
                </Box>
              </Detail>
            </Pool>
          );
        })}
      </PoolPanel>
    </StyledContainer>
  );
};

const Detail = styled(Box)`
  display: flex;
  justify-content: space-between;
  height: ${({ active }) => (active ? "100px" : "0px")};
  overflow: hidden;
  transition: all 0.3s;
  @media screen and (max-width: 450px) {
    font-size: 11px;
    height: ${({ active }) => (active ? "50px" : "0px")};
  }
`;

const Pool = styled(Box)`
  width: 647px;
  padding: 20px 26px 37px 30px;
  background: linear-gradient(to bottom, rgba(0, 255, 235, 0.2), rgba(0, 0, 0, 0));
  border: 2px solid rgb(50, 54, 83);
  border-radius: 10px;
  margin: 24px 21px;
  line-height: 166%;
  height: fit-content;
  @media screen and (max-width: 800px) {
    width: 100%;
    margin: 18px 0;
  }
  @media screen and (max-width: 550px) {
    line-height: unset;
    padding: 13px 23px 17px 17px;
  }
`;

const PoolPanel = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  // justify-content :space-evenly;
`;

const StyledContainer = styled(Box)`
  color: white;
  font-weight: 500;
  padding: 32px 25px 100px 25px;
  height: fit-content;
  width: 100%;
  @media screen and (max-width: 800px) {
    margin: 0 auto;
    padding: 32px 25px 50px 25px;
  }
  @media screen and (max-width: 550px) {
    margin: 0 auto;
    padding: 16px 20px 38px 20px;
  }
`;

export default Staking;
