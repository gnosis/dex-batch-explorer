export const BATCH_DURATION = 300;
export const FINALITY_DURATION = 60;

function timestamp(): number {
  return ~~(Date.now() / 1000);
}

function batchForTimestamp(timestamp: number): number {
  return ~~(timestamp / BATCH_DURATION);
}

function currentBatch(): number {
  return batchForTimestamp(timestamp());
}

function timestampForBatch(batch: number): number {
  return batch * BATCH_DURATION;
}

export function batchDate(batch: number): Date {
  return new Date(timestampForBatch(batch) * 1000);
}

export function timeRemainingInCurrentBatch(): number {
  const now = timestamp();
  const end = timestampForBatch(batchForTimestamp(now) + 1);
  return end - now;
}

export function solveTimeRemaining(
  batch: number,
): [number, number] | undefined {
  const now = timestamp();
  const solveStart = timestampForBatch(batch + 1);
  const solveEnd = solveStart + BATCH_DURATION;
  if (solveStart >= now || solveEnd <= now) {
    return undefined;
  }

  const remaining = solveEnd - now;
  return [Math.max(remaining - FINALITY_DURATION, 0), remaining];
}

const GP_GRAPH = "https://api.thegraph.com/subgraphs/name/gnosis/protocol";

export interface BatchSolutions {
  batch: number;
  solutions?: Solution[];
}

export interface Solution {
  solver: string;
  feeReward: bigint;
  objectiveValue: bigint;
  txHash: string;
  reverted: boolean;
}

export async function getLatestBatchSolutions(
  count: number,
  filterUnsolvedBatches: boolean,
): Promise<BatchSolutions[]> {
  const solvingBatch = currentBatch() - 1;
  const filter = filterUnsolvedBatches
    ? `first: ${count}`
    : `where: {id_gt: "${solvingBatch - count}"}`;

  const response = await fetch(GP_GRAPH, {
    method: "POST",
    body: JSON.stringify({
      query: `{
        batches(
          ${filter}
          orderBy: id
          orderDirection: desc
        ) {
          id
          solutions(
            orderBy: createEpoch,
            orderDirection: desc
          ) {
            solver{id}
            feeReward
            objectiveValue
            txHash
            revertEpoch
          }
        }
      }`,
      variables: null,
    }),
  });

  const result: {
    data: {
      batches: {
        id: string;
        solutions: {
          solver: { id: string };
          feeReward: string;
          objectiveValue: string;
          txHash: string;
          revertEpoch: string | null;
        }[];
      }[];
    };
  } = await response.json();

  const batchData: BatchSolutions[] = result.data.batches.map((batch) => ({
    batch: parseInt(batch.id),
    solutions: batch.solutions.map((solution) => ({
      solver: solution.solver.id,
      feeReward: BigInt(solution.feeReward),
      objectiveValue: BigInt(solution.objectiveValue),
      txHash: solution.txHash,
      reverted: !!solution.revertEpoch,
    })),
  }));

  if (batchData.length === 0 || batchData[0].batch !== solvingBatch) {
    const [remaining] = solveTimeRemaining(solvingBatch) || [0, 0];
    batchData.unshift({
      batch: solvingBatch,
      solutions: remaining === 0 ? [] : undefined,
    });
  }

  const batches = filterUnsolvedBatches
    ? batchData
    : [...Array(count).keys()].map((i) => {
        const batchId = solvingBatch - i;
        return (
          batchData.find((batch) => batch.batch === batchId) || {
            batch: batchId,
            solutions: [],
          }
        );
      });

  return batches.slice(0, count);
}
