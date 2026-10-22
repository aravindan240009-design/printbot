"""
Property-based and Edge-case tests for Arbitrary Non-Contiguous Page Ranges.
Verifies valid ranges, open-ended ranges, single pages, and malformed inputs.
"""

import pytest
from packages.printplan.python.printplan import resolve_ranges


@pytest.mark.parametrize("range_str, total_pages, expected", [
    ("1", 5, [1]),
    ("1-3", 5, [1, 2, 3]),
    ("1,3,5", 5, [1, 3, 5]),
    ("1-3,5", 5, [1, 2, 3, 5]),
    ("2,4", 6, [2, 4]),
    ("1-5", 5, [1, 2, 3, 4, 5]),
    ("3-5,1-2", 5, [1, 2, 3, 4, 5]),  # Normalizes to ascending
    ("1,1,2,2", 4, [1, 2]),           # Deduplicates
    ("2-4", 10, [2, 3, 4]),
    ("5-", 8, [5, 6, 7, 8]),          # Open-ended range to end of document
    ("1-", 3, [1, 2, 3]),
])
def test_valid_page_ranges(range_str, total_pages, expected):
    resolved = resolve_ranges(range_str, total_pages)
    assert resolved == expected


@pytest.mark.parametrize("bad_range, total_pages", [
    ("0", 5),          # 0-indexed not allowed (1-indexed required)
    ("6", 5),          # Exceeds total pages
    ("4-2", 5),        # Decreasing range
    ("1,,3", 5),       # Consecutive commas
    ("1-2-3", 5),      # Multiple hyphens
    ("abc", 5),        # Non-numeric
    ("-3", 5),         # Missing start index
])
def test_invalid_page_ranges_raise_error(bad_range, total_pages):
    with pytest.raises(Exception):
        resolve_ranges(bad_range, total_pages)
