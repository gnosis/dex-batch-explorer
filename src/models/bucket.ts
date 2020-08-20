import { batchDate } from './exchange';

const S3_BUCKET = 'https://gnosis-dev-dfusion.s3.amazonaws.com/'
const PARSER = new DOMParser();

const INSTANCE_CACHE: Record<number, string | undefined> = {}
export async function findInstance(batch: number): Promise<string | undefined> {
    if (window.location.host !== 'dfusion-logs.gnosis.io') {
        return undefined;
    }

    const cached = INSTANCE_CACHE[batch];
    if (cached) {
        return cached;
    }

    const path = `data/mainnet_dev/standard-solver/instances/${batchDate(batch)}/"`;
    const prefix = `prefix=${encodeURIComponent(path)}`;
    const url = `${S3_BUCKET}?${prefix}`;

    const response = await fetch(url);
    const xml = await response.text();

    const dom = PARSER.parseFromString(xml, "text/xml");
    const instances = [...dom.querySelectorAll('Contents > Key')]
        .map(key => /instance_(\d+)_/.exec(key.textContent || ""))
        .filter(match => match)
        .map(match => ({
            batch: parseInt(match![1]),
            link: `https://gnosis-dev-dfusion.s3.amazonaws.com/${encodeURIComponent(match!.input)}`
        }));

    for (const { batch, link } of instances) {
        INSTANCE_CACHE[batch] = link;
    }
    return INSTANCE_CACHE[batch];
}