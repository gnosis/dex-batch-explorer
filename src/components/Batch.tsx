import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import TrendingUp from '@material-ui/icons/TrendingUp';
import React, { useEffect, useState } from 'react';

import { findInstance, ResultData, findResult } from '../models/bucket';
import { solveTimeRemaining, BATCH_DURATION, BatchSolutions } from '../models/exchange';
import { formatTime, formatTx } from '../utilities/format';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  batch: {
    marginRight: theme.spacing(2),
  },
  tx: {
    marginRight: theme.spacing(2),
  },
  icon: {
    display: 'inline-block',
    marginLeft: theme.spacing(2),
    marginTop: theme.spacing(-2),
    marginBottom: theme.spacing(-2),
  },
  timer: {
    position: 'relative',
    display: 'inline-flex',
    float: 'right',
    marginTop: theme.spacing(-1),
  },
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
  const [solver, setSolver] = useState(undefined as ResultData | undefined);

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

  useEffect(() => {
    if (solutions && solutions.length > 0) {
      findResult(batch, solutions[0].solver).then(setSolver)
    }
  }, [batch, solutions]);

  return (
    <Paper className={classes.root}>
      {link === undefined
        ? <span className={classes.batch}>Batch #{batch}:</span>
        : <a className={classes.batch} href={link}>Batch #{batch}:</a>
      }
      <span className={classes.tx}>
        {solutions === undefined
          ? <span>Awaiting solutions...</span>
          : solutions.length === 0
            ? <span>No Solution</span>
            : <a href={`https://etherscan.io/tx/${solutions![0].txHash}`}>{formatTx(solutions![0].txHash)}</a>
        }
      </span>
      {solver
        ? <span>
          <a href={solver.result}>{solver.solver}</a>
          <a className={classes.icon} href={solver.graph}>
            <IconButton color="primary" aria-label="upload picture" component="span">
              <TrendingUp />
            </IconButton>
          </a>
        </span>
        : solutions && solutions.length > 0
          ? <span>Unknown Solver</span>
          : <span />
      }
      <SolveTimer classes={classes} batch={batch} />
    </Paper>
  );
}

const TIMER_UPDATE_INTERVAL = 250;

function SolveTimer({ batch, classes }: { batch: number, classes: ReturnType<typeof useStyles> }) {
  const [remaining, setRemaining] = useState(undefined as {
    batchRemaining: number,
    final: boolean,
  } | undefined);

  useEffect(() => {
    const timer = setInterval(() => {
      const result = solveTimeRemaining(batch);
      if (result === undefined) {
        setRemaining(undefined);
        clearInterval(timer);
        return;
      }

      const [remaining, batchRemaining] = result;
      setRemaining({
        batchRemaining,
        final: remaining === 0,
      });
    }, TIMER_UPDATE_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [batch]);

  if (!remaining) {
    return <span />;
  }
  return (
    <Box className={classes.timer}>
      <CircularProgress
        variant='static'
        color={remaining.final ? 'secondary' : 'primary'}
        value={100 * remaining.batchRemaining / BATCH_DURATION}
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
        <Typography variant='caption' component='div' color='textSecondary'>
          {formatTime(remaining.batchRemaining)}
        </Typography>
      </Box>
    </Box>
  );
}

export default Batch;