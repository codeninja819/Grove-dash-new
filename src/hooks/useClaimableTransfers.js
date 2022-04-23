import { useEffect, useState } from 'react';
import { useBridgeContext } from '../context/BridgeContext';
import { useWeb3Context } from '../context/web3Context';
import { useBridgeDirection } from './useBridgeDirection';
import {
  combineRequestsWithExecutions,
  getExecutions,
  getRequests,
} from '../lib/bridge/history';

export const useClaimableTransfers = () => {
  const { homeChainId, foreignChainId, getGraphEndpoint } =
    useBridgeDirection();
  const { account } = useWeb3Context();
  const { txHash } = useBridgeContext();
  const [transfers, setTransfers] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account) return () => undefined;
    let isSubscribed = true;
    async function update() {
      setLoading(true);
      setTransfers();
      const { requests } = await getRequests(
        account,
        getGraphEndpoint(homeChainId),
      );
      const { executions } = await getExecutions(
        getGraphEndpoint(foreignChainId),
        requests,
      );
      const homeTransfers = combineRequestsWithExecutions(
        requests,
        executions,
        homeChainId,
        foreignChainId,
      )
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter(t => !t.receivingTx);
      if (isSubscribed) {
        setTransfers(homeTransfers);
        setLoading(false);
      }
    }
    update();
    return () => {
      isSubscribed = false;
    };
  }, [account, txHash, homeChainId, foreignChainId, getGraphEndpoint]);

  return { transfers: transfers, loading };
};
