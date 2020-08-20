import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';

import { findInstance } from '../models/bucket';
import { solveTimeRemaining, BATCH_DURATION, BatchSolutions } from '../models/exchange';
import { formatTime, formatTx } from '../utilities/format';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  batch: {
    marginRight: theme.spacing(1),
  }
}));

const LINK_UPDATE_INTERVAL = 5000;

export interface BatchProps {
  batch: number;
  solutions?: {
    solver: string,
    tx: string,
  }[];
}

function Batch({ batch, solutions }: BatchSolutions) {
  const classes = useStyles();
  const [link, setLink] = useState(undefined as string | undefined);
  
  useEffect(() => {
    const updateLink = async () => {
      const link = await findInstance(batch);
      if (link) {
        setLink(link);
        clearInterval(timer);
      }
    };

    const timer = setInterval(updateLink, LINK_UPDATE_INTERVAL);
    updateLink();
    return () => clearInterval(timer);
  }, [batch]);

  return (
    <Paper className={classes.root}>
      {link === undefined
        ? <span className={classes.batch}>Batch #{batch}:</span>
        : <a className={classes.batch} href={link}>Batch #{batch}:</a>
      }
      {solutions === undefined 
        ? <SolveTimer batch={batch} />
        : solutions.length === 0 
        ? <span>No Solution</span>
        : <a href={`https://etherscan.io/tx/${solutions![0].txHash}`}>{formatTx(solutions![0].txHash)}</a>
      }
    </Paper>
  );
}

const TIMER_UPDATE_INTERVAL = 250;

function SolveTimer({ batch }: { batch: number }) {
  const [state, setState] = useState({} as {
    remaining?: string,
    variant?: 'static' | undefined,
    color?: 'secondary' | undefined,
    value?: number,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const result = solveTimeRemaining(batch);
      if (result === undefined) {
        setState({});
        clearInterval(timer);
        return;
      }

      const [remaining, batchRemaining] = result;
      setState({
        remaining: formatTime(batchRemaining),
        variant: 'static',
        color: remaining > 0 ? undefined : 'secondary',
        value: 100 * batchRemaining / BATCH_DURATION,
      });
    }, TIMER_UPDATE_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [batch]);

  return (
    <Box position='relative' display='inline-flex'>
      <CircularProgress
        variant={state.variant}
        color={state.color}
        value={state.value}
      />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position='absolute'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Typography variant='caption' component='div' color='textSecondary'>{state.remaining}</Typography>
      </Box>
    </Box>
  );
}

export default Batch;