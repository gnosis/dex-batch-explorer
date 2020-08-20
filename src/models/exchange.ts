export const BATCH_DURATION = 300;
export const FINALITY_DURATION = 60;

function timestamp(): number {
    return ~~(Date.now() / 1000);
}

function batchForTimestamp(timestamp: number): number {
    return ~~(timestamp / BATCH_DURATION);
}

function timestampForBatch(batch: number): number {
    return batch * BATCH_DURATION;
}

export function batchDate(batch: number): Date {
    return new Date(timestampForBatch(batch) * 1000);
}

export function solveTimeRemaining(batch: number): [number, number] | undefined {
    const now = timestamp();
    const solveStart = timestampForBatch(batch + 1);
    const solveEnd = solveStart + BATCH_DURATION;
    if (solveStart >= now || solveEnd <= now) {
        return undefined;
    }

    const remaining = solveEnd - now;
    return [Math.max(remaining - FINALITY_DURATION, 0), remaining];
}

const GP_GRAPH = 'https://api.thegraph.com/subgraphs/name/gnosis/protocol';

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

export async function getLatestBatchSolutions(count: number): Promise<BatchSolutions[]> {
    const solvingBatch = batchForTimestamp(timestamp()) - 1;
    const startBatch = solvingBatch - count;
    const batches = [...Array(count).keys()].map((i) => solvingBatch - i);

    const response = await fetch(GP_GRAPH, {
        method: 'POST',
        body: JSON.stringify({
            query: `{
                solutions(
                    where: {batch_gt: "${startBatch}"}
                    orderBy: createEpoch
                    orderDirection: desc
                ) {
                    batch{id}
                    solver{id}
                    feeReward
                    objectiveValue
                    txHash
                    revertEpoch
                }
              }`,
            variables: null,
        }),
    });

    const result: {
        data: {
            solutions: {
                batch: { id: string };
                solver: { id: string };
                feeReward: string;
                objectiveValue: string;
                txHash: string;
                revertEpoch: string | null;
            }[];
        };
    } = await response.json();

    return batches.map((batch) => {
        const solutions = result.data.solutions
            .filter((solution) => parseInt(solution.batch.id) - 1 === batch)
            .map((solution) => ({
                solver: solution.solver.id,
                feeReward: BigInt(solution.feeReward),
                objectiveValue: BigInt(solution.objectiveValue),
                txHash: solution.txHash,
                reverted: !!solution.revertEpoch,
            } as Solution));
        return {
            batch,
            solutions: batch === solvingBatch && solutions.length === 0 
                ? undefined
                : solutions,
        }
    });
}