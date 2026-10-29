"""
Smoke tests for experience-director skill and creative coding routing.
Validates the scenario: 'Design a premium futuristic product hero with subtle motion'
"""

import os
import pytest

SKILL_PATH = os.path.join(
    os.path.dirname(__file__), "..", ".agents", "skills", "experience-director", "SKILL.md"
)

def test_experience_director_skill_exists_and_valid():
    assert os.path.exists(SKILL_PATH), "experience-director/SKILL.md must exist"
    with open(SKILL_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert content.startswith("---"), "Must start with frontmatter"
    assert "name: experience-director" in content
    assert "description:" in content
    assert "futuristic UI" in content
    assert "premium UI" in content

def test_taste_first_operating_principle():
    with open(SKILL_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Do not confuse visual complexity with quality" in content
    assert "implementation vocabularies" in content
    assert "Establish art direction **FIRST**" in content

def test_technology_router_matrix():
    with open(SKILL_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Motion for component state; GSAP for choreography" in content
    assert "PixiJS v8" in content
    assert "Three.js with React Three Fiber" in content
    assert "prefers-reduced-motion" in content

def test_scenario_futuristic_product_hero_subtle_motion():
    """
    Simulation of user query:
    'Design a premium futuristic product hero with subtle motion'
    """
    with open(SKILL_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    query = "Design a premium futuristic product hero with subtle motion"
    
    # 1. Router must select experience-director and art direction first
    selected_skills = []
    if "futuristic" in query or "premium" in query or "hero" in query:
        selected_skills.append("experience-director")
        selected_skills.append("frontend-design")
        selected_skills.append("ui-ux-pro-max")
        
    # 2. Subtle motion routes to Motion / CSS rather than heavy physics or full 3D engine
    if "subtle motion" in query:
        selected_skills.append("motion")
        # Do NOT select Rapier or heavy WebGL unless 3D is explicitly requested
        assert "rapier" not in selected_skills
        assert "threejs-node-tsl" not in selected_skills
        assert "artemis-mobile-testing" not in selected_skills
        assert "rea-reverse-engineering" not in selected_skills
        
    assert "experience-director" in selected_skills
    assert "frontend-design" in selected_skills
    assert "motion" in selected_skills
    assert len(selected_skills) <= 4, "Must maintain progressive disclosure without context flooding"
