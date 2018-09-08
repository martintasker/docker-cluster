# Docker Cluster

The objective of this project is to demonstrate a docker cluster of node.js-based services which can easily be brought up quickly, along with a web app which uses them.

Steps to get there:

* understand and explain key points of Docker
* bring up single node app in Docker
* bring up same app in Docker Compose
* introduce a second node app and link it to the first
* bring up a web app in a practical way
* bring in a few other interesting services eg Postgres and Redis

We'll start this on Ubuntu 18.04.  But we'd like this, eventually, to work on Mac and Windows too.

## First app

### Bare-metal

`hello1400/` contains first app.  Use `npm start` (or merely `node index`) to start it: it will listen on port 1400 and say `hello world` in response to any HTTP request.  This is easily tested with curl.

### Simple docker container

Following [the guide at nodejs.org](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/) with very minor changes, we've constructed a `hello1401/` app, similar to `hello1400/` but

* now depends on Express, so that there's some node dependency to bring in at image build time
* now builds with Docker, so it's containerized

In the `Dockerfile`, we expose port 1401, and in the `run.sh` command, we bind this to 1401 in the host.

Use `build.sh` to build, and `run.sh` to run.  Note that `.dockerignore` specifies files _not_ to copy with the `COPY` command in the `Dockerfile`.

You can attach to the container using `docker attach hello1401` but it's difficult to detach without causing the container to stop.

You can inspect the file layout with `docker exec -ti hello1401 /bin/sh`, but you can't see the live console then.

You can see the live console if you start without daemonizing, ie without `-d`.

As usual we test with curl.

This is well and good, but there are problems with it:

* many parameters in `build.sh` and `run.sh`
* difficulty attaching to the running container
* need to restart rapidly when we make a development change

### Single docker container, with Compose

In `cluster1401`, we've defined a `docker-compose.yaml` file which (in the first instance) just wraps `../hello1401` in a docker command.  Note:

* we no longer need `build.sh` and `run.sh`, because they're invoked from `docker-compose`
* to both build and run, just `docker-compose up`
* to remove images generated thereby, `docker-compose rm`
* use `docker-compose up -d` to daemonize, and `docker-compose logs -f` to see the logs
