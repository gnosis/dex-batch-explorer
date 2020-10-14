import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import Container from "@material-ui/core/Container";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import FormLabel from "@material-ui/core/FormLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";

import logo from "../logo.svg";
import {
  getLatestBatchSolutions,
  BatchSolutions,
  timeRemainingInCurrentBatch,
  Network,
} from "../models/exchange";
import Batch from "./Batch";

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: "center",
    margin: theme.spacing(3),
  },
  progress: {
    display: "flex",
    width: "100%",
    justifyContent: "center",
    padding: theme.spacing(4),
    boxSizing: "border-box",
  },
  settings: {
    float: "right",
    padding: theme.spacing(1),
  },
  logo: {
    height: "20vmin",
    // NOTE: Logo isn't centered on owl, so account for that.
    translate: "-6.8%",
    transformOrigin: "56.8% 40.8%",
    pointerEvents: "none",
  },
  "@keyframes logo-spin": {
    from: {
      transform: "rotate(0deg)",
    },
    to: {
      transform: "rotate(360deg)",
    },
  },
  logoSpin: {},
  "@media (prefers-reduced-motion: no-preference)": {
    logoSpin: {
      animation: "$logo-spin 1 1s linear",
    },
  },
}));

const BATCH_UPDATE_INTERVAL = 5000;
const BATCH_COUNT = 10;
const BATCH_FILTER_UNSOLVED_KEY = "App.filterUnsolved";
const NETWORK_KEY = "App.network";

function App() {
  const classes = useStyles();
  const [filterUnsolved, setFilteredUnsolved] = useState(
    localStorage.getItem(BATCH_FILTER_UNSOLVED_KEY) === "true",
  );
  const [network, setNetwork] = useState(
    (localStorage.getItem(NETWORK_KEY) || Network.Mainnet) as Network,
  );
  const [batches, setBatches] = useState([] as BatchSolutions[]);
  const [logoClasses, setLogoClasses] = useState(classes.logo);

  const handleFilterCheckbox = (_: unknown, checked: boolean) => {
    localStorage.setItem(BATCH_FILTER_UNSOLVED_KEY, checked.toString());
    setBatches([]);
    setFilteredUnsolved(checked);
  };

  const handleNetworkChange = (_: unknown, value: string) => {
    localStorage.setItem(NETWORK_KEY, value);
    setNetwork(value as Network);
  };

  useEffect(() => {
    const updateBatches = async () => {
      const batches = await getLatestBatchSolutions(
        BATCH_COUNT,
        filterUnsolved,
        network,
      );
      setBatches(batches);
    };

    const timer = setInterval(updateBatches, BATCH_UPDATE_INTERVAL);
    updateBatches();
    return () => clearInterval(timer);
  }, [filterUnsolved, network]);

  useEffect(() => {
    const scheduleSpin = () =>
      setTimeout(spin, timeRemainingInCurrentBatch() * 1000);
    const spin = () => {
      setLogoClasses(`${classes.logo} ${classes.logoSpin}`);
      timer = setTimeout(() => {
        setLogoClasses(classes.logo);
        timer = scheduleSpin();
      }, 10000);
    };

    let timer = scheduleSpin();
    return () => clearTimeout(timer);
  }, [classes.logo, classes.logoSpin]);

  return (
    <Container fixed>
      <header className={classes.header}>
        <img src={logo} className={logoClasses} alt="logo" />
      </header>
      <Grid container direction="row" justify="space-between">
        <FormGroup className={classes.settings}>
          <FormLabel>Network</FormLabel>
          <RadioGroup
            row
            aria-label="network"
            name="network"
            value={network}
            onChange={handleNetworkChange}
          >
            <FormControlLabel
              value="mainnet"
              control={<Radio />}
              label="Mainnet"
            />
            <FormControlLabel
              value="rinkeby"
              control={<Radio />}
              label="Rinkeby"
            />
            <FormControlLabel value="xdai" control={<Radio />} label="xDAI" />
          </RadioGroup>
        </FormGroup>
        <FormGroup className={classes.settings}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filterUnsolved}
                onChange={handleFilterCheckbox}
                name="filter"
                color="primary"
              />
            }
            label="Filter unsolved batches"
          />
        </FormGroup>
      </Grid>

      {batches.length === 0 ? (
        <div className={classes.progress}>
          <CircularProgress size="8vmin" />
        </div>
      ) : (
        <Grid container spacing={3}>
          {batches.map((batch) => (
            <Grid item xs={12} key={batch.batch}>
              <Batch {...batch} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default App;
