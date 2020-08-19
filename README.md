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

## Docker and Docker-compose

We start this with Docker and Docker-compose, in the `compose/` directory.

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

* `Dockerfile` now has two-phase build, in which we `npm install` in one phase, and then copy the results of that install into the next phase.  The merit of this process is that it enables all kinds of build-time stuff, involving footprint bloat or leakage of confidential keys, to go into the builder, but only the slim final container is output, stored, and used at runtime.
* `Dockerfile` has a `VOLUME /app/src` statement, defining a mount point
* to link to this volume, the `docker-compose.yaml` file has a `volumes:` specification binding the relevant host source directory to the in-container mount point
* you can now use `docker-compose restart hello1402` to restart that particular service after making a source code change
* actually, for source code change in `index.js` or `package.json`, you'll have to rebuild the container; but for the majority of changes, in `src/`, you can edit and then simply restart

## Second app

Now we have two services, in `cluster1403`:

* the `hello1402` service which we already had
* a new `hello1403` service which fetches the result of `hello1402` and delivers that

Now what's interesting here is:

* in `hello1403/src/routes.js`, we fetch from `http://hello1402:1402`, ie we refer to the other service _by docker-compose service name_
* we do _not_ expose port 1402 to the host, in the description of `hello1402` service in `cluster1403/docker-compose.yaml`: the port is exposed to the docker network, and that's sufficient
* the `.yaml` now contains a description of both services, which are built and brought up simultaneously
* when you do a `docker-compose restart` on one service, the log-following is not interrupted -- provided there's always at least one service running

## Database

### Single database

We bring up a series of cluster databases.  We don't have to build an image because we're using stock images directly.  So there's no `Dockerfile`, only an `image` statement in `docker-compose.yaml`.

The simplest configuration is in `cluster-db-1/`,

* `docker-compose.yaml` specifies a `postgres:11.8-alpine` image, plus some environment
* `.env` specifies the password: this would not normally be committed to source

Start the db with `docker-compose up`.  You can access it using `docker-compose exec db psql -U cluster` (password will be supplied from `.env`), and then place some data in it using, eg

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

### Distinct databases

Microservices require a different database for each service.  We can do that with postgres containers, see compose file in `cluster-db-2/` which specifies `db-1` and `db-2` containers, which are separately instantiated, initialized and persisted.

You can demonstrate separate persistence by creating different tables in each, stopping the cluster, bringing it up again, and checking (a) that data persists and (b) that containers are distinct.

### Revision management

I've chosen to do revision management with Liquibase.  Liquibase's installation complexities almost outweigh its usefulness -- a perfect indication for Docker containerization.

In the `cluster-db-3/` directory, you have

* a compose file which defines `db`, a database, and which should be started in production using `docker-compose up db`
* two liquibase revision management services, `db-update`, which takes the db to the latest defined revision, and `db-rollback`, which rolls it back just one revision
* `exec-psql.sh`, which executes `psql` in the context of the `db` service

The Liquibase image is defined in its own `../liquibase/Dockerfile` which

* builds on a lightweight Alpine/Java 8 base
* includes the Liquibase command and postgres JDBC driver, hard-copied from `./lib`

So, you use

* `docker-compose up db` to bring up the database and keep it going
* `docker-compose up db-update` to update the database to the latest revision
* `docker-compose up db-rollback` to rollback the database by one revision
* `./exec-psql.sh` to go into a `psql` shell on the given database

So we have the core of a solution for revision management.  But this is only a first step: we need also,

* a compose file which only brings up the runtime services, so that we don't have to remember to specify a given service
* therefore, a separate compose file for the support services
* more resource pointers as environment variables

### Services vs tools

`cluster-db-4/` addresses the separation of runtime services and tools, so that now

* `.env` carries references -- mostly these should _not_ be committed to source in production contexts
* `docker-compose -f db.yaml up` brings up the database and keeps it going
* `docker-compose -f db-tools.yaml up db-update` updates the database to the latest revision
* `docker-compose -f db-tools.yaml up db-rollback` rolls back the database by one revision
* `./exec-psql.sh` goes into a `psql` shell on the given database -- same

This has room for a (not yet done) docker-compose.yaml file which contains the main application, dependent on these services.

## Kubernetes

We're going to migrate to Kubernetes, in the `k8s/` directory.

To start, make sure you have a working Kubernetes installation, perhaps using Docker Desktop.  Check with `kubectl cluster-info` and `kubectl get nodes`.

### Super-primitive pod

`k8s/pod1401` turns the `hello1401` container, previously built with `docker-compose build`, into a Kubernetes pod.

`k-start.sh` then starts the pod, and starts forwarding host port 1401 to pod port 1401.  Note that the port-forwarding operation doesn't succeed until the pod has properly launched.

You can look at logs with

```sh
kubectl logs -f hello1401
```

This is a _very_ primitive and wrong way of using Kubernetes!  We need

* port forwarding which works more reliably, and doesn't hog a shell
* a nicer way to look at logs

### Logging

> complete

The most primitive way to follow logs uses `kubectl logs -f`.  You can effectively do the same with host logs.

The most common way to log is to include a node-level logging agent, often elasticsearch, in turn based on fluentd.

A pod-relative "sidecar container" is also possible as a logging agent.

### Sensible networking

First, use a Deployment instead of a Pod: see `k8s/pod1401`.  We're just creating 3 instances without yet exploiting any of the fancy Deployment features (scaling, healing).

Second, use [k8s networking](https://kubernetes.io/docs/concepts/services-networking/connect-applications-service/) and Services.  Tenets of k8s networking are:

* each Pod has its own cluster-private IP address, typically on `10.1.0.0/16`.
* (and therefore, each Pod has its own full range of ports)
* specify `containerPort` on a Pod to say what port will be exposed, and available to any node in cluster

You can get IP address info `kubectl get pods -o wide`.

Start a shell on one of the container, eg

```sh
kubectl exec -ti hello1401 ash
```

Then you can `curl 10.1.x.x:1401` to any of the three Pods in the Deployment, and you'll see the Hello response.

To hide this behind a single `Service`,

* create the service with `kubectl apply -f service.yaml`
* do `kubectl get services`, and note the ClusterIP address of `hello1401`
* from an `ash` terminal within the cluster, `curl 10.96.163.76:1401` (or whatever address it was) and you'll reach one of the three Pods, via the Service
* you can also `curl hello1401:1401` to get the same via DNS

Given that the `service.yaml` (now) has `type: NodePort` and `nodePort: 31401`, on development systems you can access the service from outside the cluster, eg `curl localhost:31401`.  Only high ports in range 30000-32767 are allowed for this.

### Minimum true cluster

`k8s/cluster-1` runs a cluster containing

* a three-way deployment of the `echo` image defined in `k8s/echo`
* a NodePort service to access that from outside the cluster

The `echo` image reads its hostname from `process.env.HOSTNAME` and echoes that.  The `PORT` is fed in as an argument, so that configuration is in the domain of Docker and K8s, not NodeJS or the application code.  Ironically, since we're outside the domain of docker-compose, we have to build and name the image ourselves, which is done with `build.sh`.

The NodePort service exposes `echo` deployments on port 31402.  Repeated curling of this port on `localhost` shows that the service is randomly choosing a pod for each request.
