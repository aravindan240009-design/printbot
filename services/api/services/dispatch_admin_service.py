import httpx


_LEGACY_APPLICATION_TABLES = (
    "pilot_applications",
    "pilot_applications_historical_archive",
)


async def clear_all_dispatch_orders(
    client: httpx.AsyncClient,
    supabase_url: str,
    service_role_key: str,
) -> int:
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Prefer": "return=representation",
    }
    for table in _LEGACY_APPLICATION_TABLES:
        try:
            response = await client.delete(
                f"{supabase_url}/rest/v1/{table}",
                params={
                    "select": "id",
                    "or": "(plan.eq.ORDER,status.like.ORDER_*,id.like.PB-*)",
                },
                headers=headers,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            if error.response.status_code in {400, 404, 405}:
                continue
            raise

        deleted_records = response.json()
        if not isinstance(deleted_records, list) or any(
            not isinstance(record, dict) or not isinstance(record.get("id"), str)
            for record in deleted_records
        ):
            raise ValueError("Supabase returned an invalid dispatch deletion response.")
        return len(deleted_records)

    raise ValueError("No writable legacy dispatch table is available.")
