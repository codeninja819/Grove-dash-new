import { useEffect, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { useAddress, useWeb3Context } from "../../context/web3Context";
import Button from "../../components/Button";
import { getAccountString } from "../../utils/helper";

function ConnectMenu({ setNotification }) {
  const { connect, disconnect, connected, web3 } = useWeb3Context();
  const address = useAddress();
  const [isConnected, setConnected] = useState(connected);

  const sm = useMediaQuery("(max-width : 880px)");

  let ellipsis = address
    ? sm
      ? "Connected"
      : getAccountString(address).toUpperCase()
    : sm
    ? "Connect"
    : "Connect";

  let buttonText = ellipsis;

  function onConnect() {
    connect().then((msg) => {
      if (msg.type === "error") {
        setNotification(msg);
      }
    });
  }

  if (isConnected) {
    buttonText = ellipsis;
  }

  useEffect(() => {
    setConnected(connected);
  }, [web3, connected]);

  return (
    <div>
      <Button
        type={"primary"}
        width={"142px"}
        height={"50px"}
        onClick={() => (isConnected ? disconnect() : onConnect())}
      >
        {buttonText}
      </Button>
    </div>
  );
}

export default ConnectMenu;
