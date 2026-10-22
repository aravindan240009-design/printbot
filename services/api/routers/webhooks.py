import json
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException, status
from packages.contracts.models import PaymentWebhookPayload
from services.api.core.security import verify_webhook_signature
from services.api.core.idempotency import idempotency_store
from services.api.services.job_service import job_service

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/payments")
async def handle_payment_webhook(
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    x_timestamp: Optional[str] = Header(None, alias="X-Timestamp"),
):
    """
    Idempotent payment webhook receiver:
    1. Validates HMAC signature with anti-replay timestamp window.
    2. Enforces idempotent processing per event_id to prevent duplicate charges or duplicate prints.
    3. Atomically updates job status to PAID and enqueues for workstation printing.
    """
    raw_body = await request.body()

    # 1. Signature & Replay Attack Check
    verify_webhook_signature(
        raw_body=raw_body,
        signature_header=x_signature,
        timestamp_header=x_timestamp
    )

    try:
        data = json.loads(raw_body.decode("utf-8"))
        payload = PaymentWebhookPayload(**data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid webhook JSON payload: {str(e)}"
        )

    # 2. Idempotency Check on event_id
    matches, cached_resp, _ = idempotency_store.check(
        tenant_id=payload.tenant_id,
        idempotency_key=payload.event_id,
        payload=data
    )
    if matches and cached_resp:
        return cached_resp

    idempotency_store.start(
        tenant_id=payload.tenant_id,
        idempotency_key=payload.event_id,
        payload=data
    )

    # 3. Process payment event
    if payload.event_type in ("payment_intent.succeeded", "payment.captured", "payment.success"):
        # Extract job_id from payment_intent_id or custom payload metadata
        job_id = payload.payment_intent_id.replace("pi_mock_", "")
        try:
            updated_job = job_service.mark_paid(
                tenant_id=payload.tenant_id,
                job_id=job_id,
                payment_intent_id=payload.payment_intent_id,
                amount_paise=payload.amount_cents * 10
            )
            result = {
                "status": "success",
                "event_id": payload.event_id,
                "job_id": updated_job.id,
                "new_status": updated_job.status
            }
        except Exception as err:
            result = {
                "status": "acknowledged",
                "event_id": payload.event_id,
                "note": f"Job could not be updated: {str(err)}"
            }
    else:
        result = {
            "status": "ignored",
            "event_id": payload.event_id,
            "event_type": payload.event_type
        }

    idempotency_store.complete(
        tenant_id=payload.tenant_id,
        idempotency_key=payload.event_id,
        status_code=200,
        response=result
    )

    return result


@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    x_shop_id: Optional[str] = Header(None, alias="X-Shop-ID"),
):
    """
    Razorpay Webhook Receiver with Strict Per-Merchant Credential Verification.
    1. Validates HMAC SHA-256 signature using merchant's independent webhook secret.
    2. Enforces idempotency via event_id.
    3. Handles payment.captured, payment.failed, and refund.processed.
    """
    from services.api.services.payment_provider import razorpay_provider

    raw_body = await request.body()
    headers_dict = dict(request.headers)

    verified_event = razorpay_provider.verify_webhook(
        raw_body=raw_body,
        headers=headers_dict,
        expected_shop_id=x_shop_id,
    )

    # Check idempotency
    matches, cached_resp, _ = idempotency_store.check(
        tenant_id=verified_event.shop_id,
        idempotency_key=verified_event.event_id,
        payload=verified_event.raw_payload,
    )
    if matches and cached_resp:
        return cached_resp

    idempotency_store.start(
        tenant_id=verified_event.shop_id,
        idempotency_key=verified_event.event_id,
        payload=verified_event.raw_payload,
    )

    if verified_event.status == "PAID":
        updated_job = job_service.mark_paid(
            tenant_id=verified_event.shop_id,
            job_id=verified_event.order_id,
            payment_intent_id=verified_event.payment_intent_id,
            payment_method="UPI",
            amount_paise=verified_event.amount_paise,
        )
        result = {
            "status": "success",
            "event_id": verified_event.event_id,
            "order_id": updated_job.id,
            "new_status": updated_job.status,
        }
    else:
        result = {
            "status": "acknowledged",
            "event_id": verified_event.event_id,
            "event_type": verified_event.event_type,
        }

    idempotency_store.complete(
        tenant_id=verified_event.shop_id,
        idempotency_key=verified_event.event_id,
        status_code=200,
        response=result,
    )
    return result
