# Tigerteeh API
# Build from the backend/ directory (Railway Root Directory = backend)

FROM golang:1.26-bookworm AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates webp \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/uploads

COPY --from=build /out/api /app/api

ENV ADDR=:4000
ENV UPLOAD_DIR=/app/uploads
ENV PUBLIC_BASE_URL=http://localhost:4000

EXPOSE 4000

CMD ["/app/api"]
