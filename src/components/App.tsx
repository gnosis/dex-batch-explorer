import Container from '@material-ui/core/Container';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';

import logo from '../logo.svg';
import { getLatestBatchSolutions, BatchSolutions } from '../models/exchange';
import Batch from './Batch';

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing(4),
  },
  logo: {
    height: '20vmin',
    pointerEvents: 'none',
  },
}));

const BATCH_UPDATE_INTERVAL = 5000;
const BATCH_COUNT = 10;
const BATCH_FILTER_UNSOLVED = window.location.search.search(/solved/) !== -1;

function App() {
  const classes = useStyles();
  const [batches, setBatches] = useState([] as BatchSolutions[]);

  useEffect(() => {
    const updateBatches = async () => {
      const batches = await getLatestBatchSolutions(BATCH_COUNT, BATCH_FILTER_UNSOLVED);
      setBatches(batches);
    };

    const timer = setInterval(updateBatches, BATCH_UPDATE_INTERVAL);
    updateBatches();
    return () => clearInterval(timer);
  }, []);

  return (
    <Container fixed>
      <header className={classes.header}>
        <img src={logo} className={classes.logo} alt="logo" />
      </header>
      {batches.length === 0
        ? <CircularProgress />
        : <Grid container spacing={3}>
            {batches.map((batch) => (
              <Grid item xs={12} key={batch.batch}>
                <Batch {...batch} />
              </Grid>
            ))}
          </Grid>
      }
    </Container>
  );
}

export default App;
