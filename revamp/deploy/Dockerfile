FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS web-build
WORKDIR /build/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --ignore-scripts
COPY web/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0.401-noble@sha256:e70cdb7f80b0348f5cb85f19a8f670fca061f033d57eed12fa003d58b0e06317 AS backend-build
WORKDIR /build
COPY global.json Directory.Build.props Directory.Packages.props NuGet.Config ./
COPY backend/PocketMonkey.Host/PocketMonkey.Host.csproj backend/PocketMonkey.Host/packages.lock.json ./backend/PocketMonkey.Host/
COPY backend/PocketMonkey.Storage/PocketMonkey.Storage.csproj backend/PocketMonkey.Storage/packages.lock.json ./backend/PocketMonkey.Storage/
RUN dotnet restore backend/PocketMonkey.Host/PocketMonkey.Host.csproj --locked-mode
COPY backend/ ./backend/
RUN dotnet publish backend/PocketMonkey.Host/PocketMonkey.Host.csproj --configuration Release --no-restore --output /publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0.12-noble@sha256:222759b391a1aaf241166672c8f99b2d4ada452e7b5319f3c6e8f265a37b5ad4
ARG BUILD_REVISION=local-uncommitted
LABEL org.opencontainers.image.title="POCKET MONkEY" \
    org.opencontainers.image.description="Foundation demonstration; not ready for production use" \
    org.opencontainers.image.version="0.0.0-foundation" \
    org.opencontainers.image.revision="${BUILD_REVISION}"
RUN apt-get update \
    && apt-get install --yes --no-install-recommends supervisor tini tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 10001 --user-group --no-create-home --shell /usr/sbin/nologin pocketmonkey \
    && mkdir /data \
    && chown 10001:10001 /data \
    && chmod 0700 /data
COPY --from=web-build /usr/local/bin/node /usr/local/bin/node
COPY --from=web-build /usr/local/LICENSE /usr/local/share/licenses/node/LICENSE
COPY --from=web-build /build/web/dist/web /app/web
COPY --from=backend-build /publish /app/backend
COPY deploy/supervisord.conf deploy/process_events.py /app/
COPY --chmod=755 deploy/start.sh /app/start.sh
WORKDIR /app
USER 10001:10001
ENV NODE_ENV=production \
    ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://127.0.0.1:5080 \
    MONKEY_BACKEND_URL=http://127.0.0.1:5080 \
    HOST=0.0.0.0 \
    PORT=8080 \
    TZ=UTC \
    MONKEY_DATA_PATH=/data \
    MONKEY_DEFAULT_LOCALE=de-DE \
    MONKEY_LOG_LEVEL=Information \
    MONKEY_TRUSTED_PROXIES=
EXPOSE 8080
VOLUME /data
HEALTHCHECK --interval=15s --timeout=6s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:8080/health/ready',{signal:AbortSignal.timeout(5000)}).then(response=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/usr/bin/tini", "--", "/app/start.sh"]