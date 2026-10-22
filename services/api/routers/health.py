from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_summary():
    return {
        "status": "healthy",
        "service": "xerox-cloud-api",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/live")
def liveness():
    return {"status": "alive"}


@router.get("/ready")
def readiness():
    # Database and Redis check mock
    return {
        "status": "ready",
        "database": "connected",
        "redis": "connected",
        "r2_storage": "available"
    }
