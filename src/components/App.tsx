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

const BATCH_UPDATE_INTERVAL = 2000;
const BATCH_COUNT = 10;

function App() {
  const classes = useStyles();
  const [batches, setBatches] = useState([] as BatchSolutions[]);

  useEffect(() => {
    const timer = setInterval(() => {
      getLatestBatchSolutions(BATCH_COUNT).then(setBatches);
    }, BATCH_UPDATE_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Container>
      <header className={classes.header}>
        <img src={logo} className={classes.logo} alt="logo" />
      </header>
      {batches.length === 0
        ? <CircularProgress />
        : <Grid container spacing={3}>
            {batches.map((batch) => (
              <Grid item xs={12}>
                <Batch {...batch} />
              </Grid>
            ))}
          </Grid>
      }
    </Container>
  );
}

export default App;
