from typing import List, Dict, Any
from fastapi import APIRouter, Request
from pydantic import BaseModel
from packages.contracts.models import (
    ReconciliationRequest,
    ReconciliationResponse,
)
from services.api.services.reconciliation_service import reconciliation_service
from services.api.services.ledger_service import ledger_service, DailyReconciliationReport

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])


@router.post("/sync", response_model=ReconciliationResponse)
def reconcile_workstation_spool(req: ReconciliationRequest):
    """
    Syncs workstation local spool log with cloud state.
    Guarantees exactly-once physical printing across network disconnects, crashes, or reboots.
    """
    return reconciliation_service.reconcile(req)


class DailyLedgerReconciliationRequest(BaseModel):
    target_date: str  # 'YYYY-MM-DD'
    provider_records: List[Dict[str, Any]]


@router.post("/daily-ledger", response_model=DailyReconciliationReport)
def reconcile_daily_settlement_ledger(req: DailyLedgerReconciliationRequest, request: Request):
    """
    Daily settlement ledger reconciliation.
    Reconciles third-party payment gateway statements against internal ledger
    without exposing or viewing customer document contents.
    """
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return ledger_service.reconcile_daily_settlement(
        shop_id=tenant_id,
        target_date=req.target_date,
        provider_records=req.provider_records,
    )
