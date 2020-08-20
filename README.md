# Gnosis Protocol Batches

A simple static web page for monitoring Gnosis Protocol batches and providing
links to batch instances and solutions.

## Running

To the run the project with a development server use:

`yarn start`

## Building with Docker

A `Dockerfile` is also provided in order to build an image that hosts the static
page with NGINX on port 80:

```
$ docker build -t dex-solutions -f docker/Dockerfile .
...
$ docker run -p 80:80 dex-solutions
$ xdg-open http://localhost:80/
```
