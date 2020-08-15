FROM openjdk:8-jre-alpine

# liquibase originally from http://sourceforge.net/projects/liquibase/files/Liquibase%20Core/liquibase-3.2.2-bin.tar.gz/download
COPY lib/liquibase-3.2.2-bin.tar.gz /tmp/liquibase-3.2.2-bin.tar.gz
RUN mkdir /liquibase
RUN tar -xzf /tmp/liquibase-3.2.2-bin.tar.gz -C /liquibase
RUN chmod +x /liquibase/liquibase
RUN ln -s /liquibase/liquibase /usr/bin/

# postgres JDBC driver, obtained from https://jdbc.postgresql.org/download.html, latest Java 8+ driver
COPY lib/postgresql-42.2.5.jar /usr/bin/postgresql.jar

# directory including changelog.yaml and all the patches it points to
VOLUME /db-patches
