FROM golang:1.22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/klikin-server .

FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates tzdata && adduser -D -g '' appuser

WORKDIR /app
COPY --from=builder --chown=appuser:appuser /app/klikin-server /app/klikin-server

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/app/klikin-server"]
