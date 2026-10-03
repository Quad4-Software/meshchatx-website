FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /siteapi ./cmd/server

FROM gcr.io/distroless/static:nonroot AS api
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest
COPY --from=build /siteapi /siteapi
USER nonroot:nonroot
EXPOSE 8090
LABEL org.opencontainers.image.title="MeshChatX site API" \
      org.opencontainers.image.description="Cached GitHub, CDN, changelog, and directory proxy" \
      org.opencontainers.image.source="https://github.com/Quad4-Software/meshchatx-website" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}"
ENTRYPOINT ["/siteapi"]
