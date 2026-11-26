FROM node:26.13.1-bookworm-slim@sha256:0042e17d232a87a2cd485be1da7900fca4d10a4ad11b29e9285da1d2e54798c9 AS web-build
WORKDIR /build/web

COPY web/package.json web/package-lock.json ./
RUN npm ci --ignore-scripts

COPY web/ ./
COPY .build/about/ /build/.build/about/

ARG BUILD_VERSION
ARG BUILD_REVISION
ARG BUILD_KIND
ARG BUILD_DIRTY
ARG BUILD_REPOSITORY

RUN MONKEY_PACKAGED_BUILD=1 \
    MONKEY_BUILD_VERSION="${BUILD_VERSION}" \
    MONKEY_BUILD_REVISION="${BUILD_REVISION}" \
    MONKEY_BUILD_KIND="${BUILD_KIND}" \
    MONKEY_BUILD_DIRTY="${BUILD_DIRTY}" \
    MONKEY_BUILD_REPOSITORY="${BUILD_REPOSITORY}" npm run build

FROM mcr.microsoft.com/dotnet/sdk:11.0.100-resolute@sha256:2794448a07118a6eaf00f29ab5d2bf44928517ce5ff86505a63a69230374f599 AS backend-build
WORKDIR /build

COPY global.json Directory.Build.props Directory.Packages.props NuGet.Config ./
COPY backend/PocketMonkey.Host/PocketMonkey.Host.csproj backend/PocketMonkey.Host/packages.lock.json ./backend/PocketMonkey.Host/
COPY backend/PocketMonkey.Storage/PocketMonkey.Storage.csproj backend/PocketMonkey.Storage/packages.lock.json ./backend/PocketMonkey.Storage/
RUN dotnet restore backend/PocketMonkey.Host/PocketMonkey.Host.csproj --locked-mode

COPY backend/ ./backend/
RUN dotnet publish backend/PocketMonkey.Host/PocketMonkey.Host.csproj --configuration Release --no-restore --output /publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:11.0.0-resolute@sha256:ca396ece3f2a2e62c7a03f1d7d710b8bc7e8c9dea5597d091178d9f5bfca13f0

ARG BUILD_VERSION
ARG BUILD_REVISION
ARG BUILD_KIND
ARG BUILD_DIRTY
ARG BUILD_REPOSITORY

LABEL org.opencontainers.image.title="POCKET MONkEY" \
    org.opencontainers.image.description="Self-hosted pocket-money tracking; not ready for production use" \
    org.opencontainers.image.version="${BUILD_VERSION}" \
    org.opencontainers.image.revision="${BUILD_REVISION}" \
    org.opencontainers.image.source="${BUILD_REPOSITORY}" \
    org.pocketmonkey.build.kind="${BUILD_KIND}" \
    org.pocketmonkey.build.dirty="${BUILD_DIRTY}"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends libatomic1 supervisor tini tzdata \
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
    MONKEY_BUILD_VERSION=${BUILD_VERSION} \
    MONKEY_DATA_PATH=/data \
    MONKEY_DEFAULT_LOCALE=de-DE \
    MONKEY_LOG_LEVEL=Information \
    MONKEY_TRUSTED_PROXIES=

EXPOSE 8080
VOLUME /data

HEALTHCHECK --interval=15s --timeout=6s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:8080/health/ready',{signal:AbortSignal.timeout(5000)}).then(response=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["/usr/bin/tini", "--", "/app/start.sh"]