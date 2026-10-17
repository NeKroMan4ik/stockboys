FROM node:22-alpine AS frontend

WORKDIR /build

COPY frontend/package*.json frontend/
RUN cd frontend && npm ci

COPY frontend frontend
COPY app/engine/data app/engine/data
RUN cd frontend && npm run build


FROM python:3.13-slim AS builder

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    PIP_NO_CACHE_DIR=1

RUN pip install "poetry>=2,<3"

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry install --no-root --without dev


FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

RUN useradd --system --uid 1000 --no-create-home app

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY app ./app
COPY --from=frontend /build/frontend/dist ./static

USER app

EXPOSE 10808

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10808}"]