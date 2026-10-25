import os
from pydantic import BaseModel, model_validator


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
    CORS_ALLOWED_ORIGINS: str = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3002,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://127.0.0.1:3000,http://127.0.0.1:5173",
    )

    @model_validator(mode="after")
    def reject_insecure_production_defaults(self):
        if self.ENVIRONMENT.lower() in {"production", "prod"}:
            insecure_values = {
                "prod-insecure-change-me-4f81c9a60e0a5d2b7194",
                "whsec_test_secret_9981248912",
                "rzp_test_mock_secret_key",
                "rzp_whsec_test_secret_9981",
            }
            if self.SECRET_KEY in insecure_values or len(self.SECRET_KEY) < 32:
                raise ValueError("A strong SECRET_KEY is required in production.")
            if self.WEBHOOK_SIGNING_SECRET in insecure_values:
                raise ValueError("A production webhook signing secret is required.")
            if self.DEFAULT_PAYMENT_PROVIDER == "MOCK":
                raise ValueError("MOCK payment provider cannot be enabled in production.")
            if self.RAZORPAY_KEY_ID.startswith("rzp_test_") or self.RAZORPAY_KEY_SECRET.startswith("rzp_test_"):
                raise ValueError("Razorpay test credentials cannot be enabled in production.")
            if any(origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1") for origin in self.CORS_ALLOWED_ORIGINS.split(",")):
                raise ValueError("Production CORS_ALLOWED_ORIGINS must not contain localhost origins.")
            if not self.CORS_ALLOWED_ORIGINS.strip():
                raise ValueError("Production CORS_ALLOWED_ORIGINS cannot be empty.")
        return self


settings = Settings()
