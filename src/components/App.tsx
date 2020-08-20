import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import Container from "@material-ui/core/Container";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";

import logo from "../logo.svg";
import { getLatestBatchSolutions, BatchSolutions } from "../models/exchange";
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
    paddingRight: "3vmin",
    pointerEvents: "none",
  },
}));

const BATCH_UPDATE_INTERVAL = 5000;
const BATCH_COUNT = 10;
const BATCH_FILTER_UNSOLVED_KEY = "App.filterUnsolved";

function App() {
  const classes = useStyles();
  const [filterUnsolved, setFilteredUnsolved] = useState(localStorage.getItem(BATCH_FILTER_UNSOLVED_KEY) === "true");
  const [batches, setBatches] = useState([] as BatchSolutions[]);

  const handleFilterCheckbox = (_: unknown, checked: boolean) => {
    localStorage.setItem(BATCH_FILTER_UNSOLVED_KEY, checked.toString());
    setBatches([]);
    setFilteredUnsolved(checked);
  };

  useEffect(() => {
    const updateBatches = async () => {
      const batches = await getLatestBatchSolutions(
        BATCH_COUNT,
        filterUnsolved,
      );
      setBatches(batches);
    };
    
    const timer = setInterval(updateBatches, BATCH_UPDATE_INTERVAL);
    updateBatches();
    return () => clearInterval(timer);
  }, [filterUnsolved]);

  return (
    <Container fixed>
      <header className={classes.header}>
        <img src={logo} className={classes.logo} alt="logo" />
      </header>
<FormGroup className={classes.settings}>
        <FormControlLabel
          control={<Checkbox checked={filterUnsolved} onChange={handleFilterCheckbox} name="filter" color="primary" />}
          label="Filter unsolved batches"
        />
      </FormGroup>

      {batches.length === 0 ? (
        <div className={classes.progress}>
        <CircularProgress size="8vmin"/>
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
