from fastapi import APIRouter
from packages.contracts.models import (
    ReconciliationRequest,
    ReconciliationResponse,
)
from services.api.services.reconciliation_service import reconciliation_service

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])


@router.post("/sync", response_model=ReconciliationResponse)
def reconcile_workstation_spool(req: ReconciliationRequest):
    """
    Syncs workstation local spool log with cloud state.
    Guarantees exactly-once physical printing across network disconnects, crashes, or reboots.
    """
    return reconciliation_service.reconcile(req)
