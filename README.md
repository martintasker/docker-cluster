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

Test with `curl localhost:1401`.

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
* the `npm install` is now done in a _builder_ phase, not as part of the runtime container
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

## Database

### Single database

The most trivial configuration is in `cluster-db-1/`, simply specifying a `postgres:9.5-alpine` image.

This brings up with a highly visible warning, and without a password.

You can access it using `docker-compose exec db psql -U postgres`, and then place some data in it using, eg

```sql
create table info (name text,description text);
insert into info values('foo','first meta-variable');
```

You can then see that this worked, using `select * from info;`.

Check persistence: interrupt the cluster, bring it up again, connect again and issue the same `select * from info;` command, and you'll see the data is still there.  The data is stored in the container itself, since no mapping to host is provided for the needed volume.

This is a great start, though it leaves lots of practical database questions open:

* one db per microservice
* revision management
* programmatic access
* persistent data management
* credential management

### Distinct databases

Microservices require a different database for each service.  We can do that with postgres containers, see compose file in `cluster-db-2/` which specifies `db-1` and `db-2` containers, which are separately instantiated, initialized and persisted.

You can demonstrate separate persistence by creating different tables in each, stopping the cluster, bringing it up again, and checking (a) that data persists and (b) that containers are distinct.

### Revision management

I've chosen to do revision management with Liquibase.  Liquibase's installation complexities almost outweight its usefulness -- a perfect indication for Docker containerization.

In the `cluster-db-3/` directory, you have

* a compose file which defines `db`, a database, and which should be started in production using `docker-compose up db`
* two liquibase revision management services, `db-update`, which takes the db to the latest defined revision, and `db-rollback`, which rolls it back just one revision
* `exec-psql.sh`, which executes `psql` in the context of the `db` service

The Liquibase image is defined in its own `../liquibase/Dockerfile` which

* builds on a lightweight Alpine/Java 8 base
* includes the Liquibase command and postgres JDBC driver, hard-copied from `./lib`
* includes a convenience `lq.sh` to set Liquibase parameters for any offered command

So, you use

* `docker-compose up db` to bring up the database and keep it going
* `docker-compose up db-update` to update the database to the latest revision
* `docker-compose up db-rollback` to rollback the database by one revision
* `./exec-psql.sh` to go into a `psql` shell on the given database

So we have the core of a solution for revision management.  But this is only a first step: we need also,

* a compose file which only brings up the runtime services, so that we don't have to remember to specify a given service
* therefore, a separate compose file for the support services
* additional parameterization on the liquibase image so that it can be used in the context of multi-db microservice clusters

### Services vs tools

`cluster-db-4/` addresses the separation of runtime services and tools, so that now

* `docker-compose up` brings up the database and keeps it going -- more convenient
* `docker-compose -f tools.yaml up db-update` updates the database to the latest revision -- less convenient
* `docker-compose -f tools.yaml up db-rollback` rolls back the database by one revision -- less convenient
* `./exec-psql.sh` goes into a `psql` shell on the given database -- same
