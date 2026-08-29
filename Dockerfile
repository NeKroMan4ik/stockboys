FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install poetry && poetry install --no-root

COPY . .

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10808"]