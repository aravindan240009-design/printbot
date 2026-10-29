"""
Smoke tests for Antigravity Developer Tool & Skills Router
Validates routing logic across 9 key engineering scenarios.
"""

import os
import re
import pytest

ROUTER_PATH = os.path.join(
    os.path.dirname(__file__), "..", ".agents", "skills", "developer-tool-router", "SKILL.md"
)

def test_router_skill_exists_and_has_valid_frontmatter():
    assert os.path.exists(ROUTER_PATH), "developer-tool-router/SKILL.md must exist"
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert content.startswith("---"), "Must contain YAML frontmatter start"
    assert "name: developer-tool-router" in content
    assert "description:" in content

def test_scenario_saas_dashboard():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 1: SaaS dashboard must invoke UI/UX & shadcn, NOT Three.js
    assert "Design a SaaS dashboard" in content
    assert "ui-ux-pro-max" in content
    assert "shadcn" in content
    assert "Do NOT load:** Three.js" in content

def test_scenario_cinematic_3d():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 2: Cinematic 3D landing page invokes R3F + GSAP + Motion
    assert "cinematic 3D landing page" in content
    assert "threejs-r3f" in content
    assert "gsap-scrolltrigger" in content
    assert "Reduced-motion checks" in content

def test_scenario_marketing_video():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 3: Video animation invokes Remotion, not live 3D canvas
    assert "Animate a product explainer" in content
    assert "remotion-render" in content
    assert "Do NOT load:** Live Three.js" in content

def test_scenario_backend_fastapi():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 4: Asynchronous backend invokes FastAPI & multi-tenancy
    assert "fastapi-backend-engineering" in content
    assert "secure-multitenancy" in content
    assert "Pydantic v2" in content

def test_scenario_database_design():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 5: Database design & slow query tuning
    assert "database-design" in content
    assert "postgresql-performance" in content
    assert "EXPLAIN (ANALYZE, BUFFERS)" in content

def test_scenario_mobile_artemis():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 6: Android mobile testing invokes ARTEMIS with permission gate
    assert "artemis-mobile-testing" in content
    assert "permission-gated under Tier E" in content

def test_scenario_reverse_engineering_rea():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 7: Authorized binary disassembly invokes REA with strict boundary
    assert "rea-reverse-engineering" in content
    assert "Authorized user analysis targets only" in content

def test_scenario_agent_reach_supply_chain():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 8: Cross-platform research invokes Agent-Reach, rejecting PyPI package
    assert "agent-reach-research" in content
    assert "reject PyPI `agent-reach`" in content

def test_scenario_whatsapp_production_official():
    with open(ROUTER_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Scenario 9: WhatsApp business production prefers official Cloud API
    assert "Official Meta WhatsApp Cloud API recommendations first" in content
    assert "Unofficial WhatsApp Web bridges carry account ban warnings" in content
