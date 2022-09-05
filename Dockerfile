FROM perftool/base:node

COPY . /opt/perf

WORKDIR /opt/perf

RUN npm install

CMD ["/usr/bin/dumb-init", "bash", "-vx", "/opt/perf/scripts/start.sh"]
