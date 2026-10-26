FROM mcr.microsoft.com/devcontainers/base@sha256:d94c97dd9cacf183d0a6fd12a8e87b526e9e928307674ae9c94139139c0c6eae

RUN apt-get update \
    && apt-get install --yes --no-install-recommends gh jq \
    && rm -rf /var/lib/apt/lists/*