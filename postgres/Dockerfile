FROM postgres

COPY *.sh /docker-entrypoint-initdb.d/
COPY *.sql /docker-entrypoint-initdb.d/
RUN mkdir -p /var/postgres/passwords

ARG postgres_pwd
ARG admin_pwd
ARG app_pwd
RUN if [ "${postgres_pwd}" ]; then \
      echo ${postgres_pwd} > /var/postgres/passwords/postgres_pwd; \
      echo ${admin_pwd} > /var/postgres/passwords/admin_pwd; \
      echo ${app_pwd} > /var/postgres/passwords/app_pwd; \
    fi

RUN cat docker-entrypoint.sh | sed 22s/\"\$POSTGRES_PASSWORD\"/'-f \/var\/postgres\/passwords\/postgres_pwd'/> docker-entrypoint.tmp
RUN cat docker-entrypoint.tmp | sed 23s/\'\$POSTGRES_PASSWORD\'/\''\$(cat \/var\/postgres\/passwords\/postgres_pwd)'\'/ > docker-entrypoint.sh
RUN rm docker-entrypoint.tmp
