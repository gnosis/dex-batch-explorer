import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import DonutLarge from "@material-ui/icons/DonutLarge";
import List from "@material-ui/icons/List";
import PlaylistAddCheck from "@material-ui/icons/PlaylistAddCheck";
import React, { useEffect, useState } from "react";

import { findInstance, ResultData, findResult } from "../models/bucket";
import {
  solveTimeRemaining,
  BATCH_DURATION,
  BatchSolutions,
} from "../models/exchange";
import { formatTime, formatTx } from "../utilities/format";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3, 4),
  },
  batch: {
    marginRight: theme.spacing(2),
  },
  tx: {
    marginRight: theme.spacing(2),
  },
  icon: {
    display: "inline-block",
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(-2),
    marginBottom: theme.spacing(-2),
  },
  hidden: {
    visibility: "hidden",
  },
  right: {
    textAlign: "right",
  },
  timerContainer: {
    position: "relative",
  },
  timer: {
    position: "absolute",
    display: "inline-flex",
    right: 0,
    top: theme.spacing(-1) + 2,
  },
}));

export interface BatchProps {
  batch: number;
  solutions?: {
    solver: string;
    tx: string;
  }[];
}

const LINK_UPDATE_INTERVAL = 5000;

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
  }, [batch, solutions]);

  const solverAddress = (solutions || [])[0]?.solver;
  useEffect(() => {
    if (solverAddress) {
      findResult(batch, solverAddress).then(setSolver);
    }
  }, [batch, solverAddress]);

  return (
    <Paper className={classes.root}>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          Batch #{batch}
        </Grid>
        <Grid item xs={3}>
          {solver
            ? solver.solver
            : solutions && solutions.length > 0
            ? "Unknown Solver"
            : ""}
        </Grid>
        <Grid item xs={2}>
          {solutions === undefined ? (
            <span>Solving...</span>
          ) : solutions.length === 0 ? (
            <span>No Solution</span>
          ) : (
            <span>
              Tx{" "}
              <a href={`https://etherscan.io/tx/${solutions![0].txHash}`}>
                {formatTx(solutions![0].txHash)}
              </a>
            </span>
          )}
        </Grid>
        <Grid item xs={3} className={classes.right}>
          <Tooltip title="Instance">
            <LinkButton classes={classes} href={link} icon={List} />
          </Tooltip>
          <Tooltip title="Result">
            <LinkButton
              classes={classes}
              href={solver?.result}
              icon={PlaylistAddCheck}
            />
          </Tooltip>
          <Tooltip title="Graph">
            <LinkButton
              classes={classes}
              href={solver?.graph}
              icon={DonutLarge}
            />
          </Tooltip>
        </Grid>
        <Grid item xs={1} className={classes.timerContainer}>
          <SolveTimer classes={classes} batch={batch} />
        </Grid>
      </Grid>
    </Paper>
  );
}

const LinkButton = React.forwardRef(function LinkButton(
  {
    href,
    classes,
    icon,
  }: {
    href: string | undefined;
    classes: ReturnType<typeof useStyles>;
    icon: any;
  },
  ref: any,
) {
  const Icon = icon;
  return (
    <Link className={classes.icon} href={href} ref={ref}>
      <IconButton className={href ? undefined : classes.hidden} color="primary">
        <Icon />
      </IconButton>
    </Link>
  );
});

const TIMER_UPDATE_INTERVAL = 250;

function SolveTimer({
  batch,
  classes,
}: {
  batch: number;
  classes: ReturnType<typeof useStyles>;
}) {
  const [remaining, setRemaining] = useState(
    undefined as
      | {
          batchRemaining: number;
          final: boolean;
        }
      | undefined,
  );

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
    return <Box width={40} />;
  }
  return (
    <Box className={classes.timer}>
      <CircularProgress
        variant="static"
        color={remaining.final ? "secondary" : "primary"}
        value={(100 * remaining.batchRemaining) / BATCH_DURATION}
      />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {formatTime(remaining.batchRemaining)}
        </Typography>
      </Box>
    </Box>
  );
}

export default Batch;
