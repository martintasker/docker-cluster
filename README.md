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

### Restart on code change

In `cluster1402` and `hello1402` we've made some changes:

* the Dockerfile has a `VOLUME /app` statement, defining a mount point, before the `WORKDIR /app` statement
* to link to this volume, the `docker-compose.yaml` file has a `volumes:` specification binding the relevant host source directory to the in-container mount point
* the `npm install` is now done in the _host_, not as part of building the Docker container, and there is no need to copy anything
* you can now use `docker-compose restart hello1402` to restart that particular service after making a source code change

## Second app

Now we have two services, in `cluster1403`:

* the `hello1402` service which we already had
* a new `hello1403` service which fetches the result of `hello1402` and delivers that

Now what's interesting here is:

* in `hello1403/index.js`, we fetch from `http://hello1402:1402`, ie we refer to the other service _by docker-compose service name_
* we do _not_ expose port 1402 to the host, in the description of `hello1402` service in `cluster1403/docker-compose.yaml`: the port is exposed to the docker network, and that's sufficient
* the `.yaml` now contains a description of both services, which are built and brought up simultaneously
* when you do a `docker-compose restart` on one service, the log-following is not interrupted -- provided there's always at least one service running
