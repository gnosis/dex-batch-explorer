# Gnosis Protocol Batch Explorer

A simple static web page for monitoring Gnosis Protocol batches and providing
links to batch instances and solutions.

## Running

To the run the project with a development server use:

`yarn start`

## Building with Docker

A `Dockerfile` is also provided in order to build an image that hosts the static
page with NGINX on port 80:

```
$ docker build -t dex-batch-explorer -f docker/Dockerfile .
...
$ docker run -d -p 80:80 dex-batch-explorer
$ xdg-open http://localhost:80/
```
