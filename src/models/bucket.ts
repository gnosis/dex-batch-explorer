import { formatDate } from '../utilities/format';
import { batchDate } from './exchange';

const S3_BUCKET = 'https://gnosis-dev-dfusion.s3.amazonaws.com';
const PARSER = new DOMParser();

const INSTANCE_CACHE: Record<number, string | undefined> = {};
let INSTANCE_FIRST_CACHE: Promise<void> | null = null;
export async function findInstance(batch: number): Promise<string | undefined> {
  if (!INSTANCE_FIRST_CACHE) {
    INSTANCE_FIRST_CACHE = updateInstanceCache(batch);
  }
  await INSTANCE_FIRST_CACHE;

  const cached = INSTANCE_CACHE[batch];
  if (cached) {
    return cached;
  }

  updateInstanceCache(batch);

  return INSTANCE_CACHE[batch];
}

async function updateInstanceCache(batch: number): Promise<void> {
  const path = `data/mainnet_dev/standard-solver/instances/${formatDate(batchDate(batch))}/`;
  const instances = (await ls(path))
    .map(path => /instance_(\d+)_/.exec(path))
    .filter(match => match)
    .map(match => ({
      batch: parseInt(match![1]),
      link: link(match!.input),
    }));

  for (const { batch, link } of instances) {
    INSTANCE_CACHE[batch] = link;
  }
}

export interface ResultData {
  solver: string,
  result: string,
  graph: string,
}

export async function findResult(batch: number, solver: string): Promise<ResultData | undefined> {
  const solverData = getSolverByAddress(solver);
  if (!solverData) {
    return undefined;
  }

  const path = `data/${solverData.path}/results/${formatDate(batchDate(batch))}/`;
  const resultDir = (await ls(path))
    .map(path => /instance_(\d+)_/.exec(path))
    .filter(match => match)
    .map(match => ({
      batch: parseInt(match![1]),
      prefix: match!.input,
    }))
    .find(resultDir => resultDir.batch === batch);
  if (!resultDir) {
    return undefined;
  }

  return {
    solver: solverData.name,
    result: link(`${resultDir.prefix}06_solution_int_valid.json`),
    graph: link(`${resultDir.prefix}solution-graph.html`),
  }
}


interface SolverData {
  name: string,
  path: string,
}

const SOLVERS: Record<string, SolverData | undefined> = {
  '0x5a30ff01dc11223cff4e99d4263cb6f3aaa69e70': {
    name: 'Staging Standard Solver',
    path: 'mainnet_dev/standard-solver',
  },
  '0x453ad119f26128034d3b5c2b6179b8b7f63ae1c7': {
    name: 'Staging Open Solver',
    path: 'mainnet_dev/open-solver',
  },
  '0xe5a93f2ffbc70c39154b09d6511fc612d2f16de4': {
    name: 'Staging Best-Ring Solver',
    path: 'mainnet_dev/best-ring-solver',
  },
  '0x9ee11fccd3f692d1ddb281d81403b7e08b964c76': {
    name: 'Production Standard Solver',
    path: 'mainnet_prod/standard-solver',
  },
  '0x0f833795b7597fcb7f22d8278c91ef63d441e949': {
    name: 'Production Open Solver',
    path: 'mainnet_prod/open-solver',
  },
  '0x665316dabde5c5bc57ad0b2eed523447c5d2a570': {
    name: 'Production Best-Ring Solver',
    path: 'mainnet_prod/best-ring-solver',
  },
};

function getSolverByAddress(solverAddress: string): SolverData | undefined {
  return SOLVERS[solverAddress.toLowerCase()];
}

async function ls(path: string, recusive: boolean = false): Promise<string[]> {
  const resurse = recusive ? '' : 'list-type=2&delimiter=%2F';
  const prefix = `prefix=${encodeURIComponent(path)}`;
  const url = `${S3_BUCKET}/?${resurse}&${prefix}`;

  const response = await fetch(url);
  const xml = await response.text();

  const dom = PARSER.parseFromString(xml, "text/xml");
  const items = [
    ...dom.querySelectorAll('Contents > Key'),
    ...dom.querySelectorAll('CommonPrefixes > Prefix'),
  ]
    .filter(item => item.textContent)
    .map(item => item.textContent!);

  return items;
}

function link(path: string): string {
  return `https://gnosis-dev-dfusion.s3.amazonaws.com/${encodeURIComponent(path)}`;
}