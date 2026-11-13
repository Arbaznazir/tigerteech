# Tigerteeh API — build & run independently
# docker build -t tigerteeh-api ./backend
# docker run --env-file backend/.env -p 4000:4000 tigerteeh-api

# ── Stage 1: Build ──
FROM golang:1.26-bookworm AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# ── Stage 2: Runtime ──
FROM debian:bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates webp \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /app/uploads

COPY --from=build /out/api /app/api

ENV ADDR=:4000 \
    UPLOAD_DIR=/app/uploads \
    PUBLIC_BASE_URL=http://localhost:4000

EXPOSE 4000
VOLUME ["/app/uploads"]

CMD ["/app/api"]
