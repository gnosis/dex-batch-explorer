import { formatDate } from "../utilities/format";
import { batchDate, Network } from "./exchange";

const PARSER = new DOMParser();

const STAGING_BUCKET = "gnosis-dev-dfusion";
const PRODUCTION_BUCKET = "gnosis-europe-dfusion";

function s3Url(bucket: string): string {
  return `https://${bucket}.s3.amazonaws.com`;
}

const INSTANCE_CACHE: Record<Network, Record<number, string | undefined>> = {
  [Network.Mainnet]: {},
  [Network.Rinkeby]: {},
  [Network.Xdai]: {},
};
const INSTANCE_CACHE_UPDATE: Record<string, Promise<void> | undefined> = {};

export async function findInstance(
  network: Network,
  batch: number,
): Promise<string | undefined> {
  const cached = INSTANCE_CACHE[network][batch];
  if (cached) {
    return cached;
  }

  // NOTE: Always default to using instance files from the staging standard
  // solver as, currently, they are the same across all solvers.
  const bucket = STAGING_BUCKET;
  const path = `data/${network}_dev/standard-solver/instances/${formatDate(
    batchDate(batch),
  )}/`;

  // NOTE: Synchronize the updates to the instance cache. This is done so that
  // on initial load there aren't multiple requests for listing the instance
  // files on the S3 bucket.
  const updateKey = `${bucket}/${path}`;
  if (!INSTANCE_CACHE_UPDATE[updateKey]) {
    INSTANCE_CACHE_UPDATE[updateKey] = updateInstanceCache(
      bucket,
      path,
      network,
    );
  }
  await INSTANCE_CACHE_UPDATE[updateKey];

  return INSTANCE_CACHE[network][batch];
}

async function updateInstanceCache(
  bucket: string,
  path: string,
  network: Network,
): Promise<void> {
  const instances = (await ls(bucket, path))
    .map((path) => /instance_(\d+)_/.exec(path))
    .filter((match) => match)
    .map((match) => ({
      batch: parseInt(match![1]),
      link: link(bucket, match!.input),
    }));

  for (const { batch, link } of instances) {
    INSTANCE_CACHE[network][batch] = link;
  }
}

export interface ResultData {
  solver: string;
  links?: {
    result: string;
    graph: string;
  };
}

export async function findResult(
  batch: number,
  solver: string,
): Promise<ResultData | undefined> {
  const solverData = getSolverByAddress(solver);
  if (!solverData) {
    return undefined;
  }

  const { bucket } = solverData;
  const path = `data/${solverData.path}/results/${formatDate(
    batchDate(batch),
  )}/`;
  const resultDir = (await ls(bucket, path))
    .map((path) => /instance_(\d+)_/.exec(path))
    .filter((match) => match)
    .map((match) => ({
      batch: parseInt(match![1]),
      prefix: match!.input,
    }))
    .find((resultDir) => resultDir.batch === batch);
  if (!resultDir) {
    return {
      solver: solverData.name,
    };
  }

  return {
    solver: solverData.name,
    links: {
      result: link(bucket, `${resultDir.prefix}06_solution_int_valid.json`),
      graph: link(bucket, `${resultDir.prefix}solution-graph.html`),
    },
  };
}

interface SolverData {
  name: string;
  bucket: string;
  path: string;
}

const SOLVERS: Record<string, SolverData | undefined> = {
  "0x5a30ff01dc11223cff4e99d4263cb6f3aaa69e70": {
    name: "Staging Standard Solver",
    bucket: STAGING_BUCKET,
    path: "mainnet_dev/standard-solver",
  },
  "0x453ad119f26128034d3b5c2b6179b8b7f63ae1c7": {
    name: "Staging Open Solver",
    bucket: STAGING_BUCKET,
    path: "mainnet_dev/open-solver",
  },
  "0xe5a93f2ffbc70c39154b09d6511fc612d2f16de4": {
    name: "Staging Best-Ring Solver",
    bucket: STAGING_BUCKET,
    path: "mainnet_dev/best-ring-solver",
  },
  "0x9ee11fccd3f692d1ddb281d81403b7e08b964c76": {
    name: "Production Standard Solver",
    bucket: PRODUCTION_BUCKET,
    path: "mainnet_prod/standard-solver",
  },
  "0x0f833795b7597fcb7f22d8278c91ef63d441e949": {
    name: "Production Open Solver",
    bucket: PRODUCTION_BUCKET,
    path: "mainnet_prod/open-solver",
  },
  "0x665316dabde5c5bc57ad0b2eed523447c5d2a570": {
    name: "Production Best-Ring Solver",
    bucket: PRODUCTION_BUCKET,
    path: "mainnet_prod/best-ring-solver",
  },
  "0x122085960fe0124569cb99211e6dfad082a10f92": {
    name: "Staging Best-Ring Solver (xDAI)",
    bucket: STAGING_BUCKET,
    path: "xdai_dev/best-ring-solver",
  },
  "0x03e941626aacd9f088a5d24479f22f2e87045cda": {
    name: "Staging Standard Solver (xDAI)",
    bucket: STAGING_BUCKET,
    path: "xdai_dev/standard-solver",
  },
  "0x66651c3136f45f5a3f216bdcf794246bdf92163e": {
    name: "Staging Open Solver (xDAI)",
    bucket: STAGING_BUCKET,
    path: "xdai_dev/open-solver",
  },
  "0xe6493dc08f582a0cb9be77e6d071d0ec2789b458": {
    name: "Production Best-Ring Solver (xDAI)",
    bucket: PRODUCTION_BUCKET,
    path: "xdai_prod/best-ring-solver",
  },
  "0xc5a631cac2f9c189465b0bb8872a3cbf5ecc8eda": {
    name: "Production Standard Solver (xDAI)",
    bucket: PRODUCTION_BUCKET,
    path: "xdai_prod/standard-solver",
  },
  "0x8e5f509b331337f080a220a2f5c98daeda0868ef": {
    name: "Production Open Solver (xDAI)",
    bucket: PRODUCTION_BUCKET,
    path: "xdai_prod/open-solver",
  },
  "0xa800b730ca1270a3db0d23c4643363fe795e2fe6": {
    name: "Staging Best-Ring Solver (Rinkeby)",
    bucket: STAGING_BUCKET,
    path: "rinkeby_dev/best-ring-solver",
  },
  "0x3851195b21d672e88bbd45f0da94e1d14b755339": {
    name: "Staging Standard Solver (Rinkeby)",
    bucket: STAGING_BUCKET,
    path: "rinkeby_dev/standard-solver",
  },
  "0x8bda84af06bd413f7e47fcbff1b6474b91b41df2": {
    name: "Staging Open Solver (Rinkeby)",
    bucket: STAGING_BUCKET,
    path: "rinkeby_dev/open-solver",
  },
};

function getSolverByAddress(solverAddress: string): SolverData | undefined {
  return SOLVERS[solverAddress.toLowerCase()];
}

async function ls(
  bucket: string,
  path: string,
  recusive: boolean = false,
): Promise<string[]> {
  const resurse = recusive ? "" : "list-type=2&delimiter=%2F";
  const prefix = `prefix=${encodeURIComponent(path)}`;
  const url = `${s3Url(bucket)}/?${resurse}&${prefix}`;

  const response = await fetch(url);
  const xml = await response.text();

  const dom = PARSER.parseFromString(xml, "text/xml");
  const items = [
    ...dom.querySelectorAll("Contents > Key"),
    ...dom.querySelectorAll("CommonPrefixes > Prefix"),
  ]
    .filter((item) => item.textContent)
    .map((item) => item.textContent!);

  return items;
}

function link(bucket: string, path: string): string {
  const encoded = encodeURIComponent(path);
  return `${s3Url(bucket)}/${encoded}`;
}
