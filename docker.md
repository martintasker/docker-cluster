# Docker

Basics:

* get an _image_: either _pull_ from a _registry_, or _build_
* _run_ that image, which _always_ makes a _container_
* _start_, _stop_, _kill_, _exec_ or _attach_ to containers, or _rm_ them
* list all images (`images`) or containers (`ps -a`)
* expose _ports_ from container to host
* share _volumes_ (file trees) from host to container

## Starting etc

When you run an image, it creates a container, which you can give a name:

```sh
run [-ti] [-d] [--name container-name] image-name cmd
start id|container-name
attach id|container-name
exec [-ti] [-d] id|container-name cmd
stop id|container-name
kill id|container-name
rm [-f] id|container-name
```

There's `--restart always|on-failure` for `run` (perhaps others).

## Images

```shell
images [repo]
pull repo/image:tag
search name
login [server]
commit [-m msg] [-a author] container repo/image[:tag]
build -t name path
inspect repo/image:tag
history image
```

Images live in repos (or are top-level), respos in registries.

Top-level image, eg `ubuntu`.  Image in user repo, eg `me/server`.

Tags are used for versioning.  Default is `latest`..

## Inspecting containers

```sh
stats
ps [-a] [-q]
top [-f]
inspect [--format '{{.NetworkSettings.IPAddress}}'] name[names]
```

## building

```docker
from image
export port
cmd command
entrypoint command-processor
workdir path
env var value
user user[:group]
volume [mount-point-list]
copy|add source target
label label=value
arg var=value
stopsignal
shell [binary, parms]
healthcheck --interval=10m --timeout=1m --retries=5 cmd curl ... || exit 1
healthcheck none
onbuild cmd (eg add . /var/www)
```

## Networking

```shell
run -p [hostport:]containerport image cmd
```

Inspect with `docker port [container container-port]`.

`run -p` can bind to interfaces as well as ports.  `-P` exposes all ports specified in image.

## Volumes

```shell
run -v host-dir:container-vol[:(rw?ro)]
```

## Networking

```shell
network create name
network connect net cont
network disconnect net cont
network inspect net
network ls
docker run --network net ...
```

`network inspect` results include _active_ containers.

`inspect` on an active image shows networks of which it is a member.
`bridge` is default, so don't use that.
