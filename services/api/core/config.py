import os
from pydantic import BaseModel


class Settings(BaseModel):
    APP_NAME: str = "Xerox SaaS Cloud API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "prod-insecure-change-me-4f81c9a60e0a5d2b7194")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    WEBHOOK_SIGNING_SECRET: str = os.getenv("WEBHOOK_SIGNING_SECRET", "whsec_test_secret_9981248912")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./xerox.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "xerox-documents")
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "local-r2-account")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "local-r2-key")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "local-r2-secret")
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock_key_id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_mock_secret_key")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_whsec_test_secret_9981")
    DEFAULT_PAYMENT_PROVIDER: str = os.getenv("DEFAULT_PAYMENT_PROVIDER", "MOCK")


settings = Settings()
