FROM node:16-alpine3.13

RUN mkdir /app /cdk /home/node/.config
RUN chown node:node /app /cdk /home/node/.config

RUN apk update && \
    apk add \
      sudo python3 py3-pip bash shadow make g++ &&  \
    pip3 --no-cache-dir install --upgrade awscli && \
    rm -rf /var/cache/apk/*

USER node
WORKDIR /cdk

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./

RUN npm ci
RUN npm install -g aws-cdk
ENV PATH="/home/node/.npm-global/bin:${PATH}"

WORKDIR /app
USER root

COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod 0755 /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
