import { useEffect, useState } from "react";
import { fetchAmbVersion } from "../lib/bridge/amb";
import { getEthersProvider, getNetworkLabel } from "../utils/helper";

export const useAmbVersion = (foreignChainId, foreignAmbAddress) => {
  const [foreignAmbVersion, setForeignAmbVersion] = useState();
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const label = getNetworkLabel(foreignChainId).toUpperCase();
    const key = `${label}-AMB-VERSION`;
    const fetchVersion = async () => {
      const provider = await getEthersProvider(foreignChainId);
      await fetchAmbVersion(foreignAmbAddress, provider)
        .then((versionString) => {
          setForeignAmbVersion(versionString);
          sessionStorage.setItem(key, versionString);
        })
        .catch((versionError) => console.error({ versionError }));
      setFetching(false);
    };
    const version = sessionStorage.getItem(key);
    if (!version && !fetching) {
      setFetching(true);
      fetchVersion();
    } else {
      setForeignAmbVersion(version);
    }
  }, [foreignAmbAddress, foreignChainId, fetching]);

  return foreignAmbVersion;
};
