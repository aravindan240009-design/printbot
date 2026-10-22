//! PrintPlan v1 reference validation. Trusted tenant context is supplied separately.
//! Render hashes bind the recipe and source digests, not pixels or authorization.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

const LIMIT: usize = 100_000;

fn integer(v: &Value) -> Option<u64> {
    v.as_u64().or_else(|| {
        v.as_f64()
            .filter(|n| n.is_finite() && *n >= 0.0 && n.fract() == 0.0)
            .map(|n| n as u64)
    })
}

fn pattern(text: &str, pattern: &str) -> bool {
    let hex = |c: u8| c.is_ascii_digit() || (b'a'..=b'f').contains(&c);
    match pattern {
        // Rust UTF-8 strings cannot contain unpaired UTF-16 surrogates.
        "^[^\\uD800-\\uDFFF]*$" => true,
        "^[0-9a-f]{64}$" => text.len() == 64 && text.bytes().all(hex),
        "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" => {
            text.len() == 36
                && text.bytes().enumerate().all(|(i, c)| {
                    if [8, 13, 18, 23].contains(&i) {
                        c == b'-'
                    } else {
                        hex(c)
                    }
                })
        }
        _ => false,
    }
}

fn structural(value: &Value, rule: &Value) -> Result<(), String> {
    if let Some(branches) = rule["anyOf"].as_array() {
        return if branches.iter().any(|b| structural(value, b).is_ok()) {
            Ok(())
        } else {
            Err("schema anyOf".into())
        };
    }
    let check_type = |kind: &str| match kind {
        "null" => value.is_null(),
        "integer" => integer(value).is_some(),
        "string" => value.is_string(),
        "boolean" => value.is_boolean(),
        "array" => value.is_array(),
        "object" => value.is_object(),
        _ => false,
    };
    let valid_type = if let Some(types) = rule["type"].as_array() {
        types.iter().any(|t| check_type(t.as_str().unwrap_or("")))
    } else {
        check_type(rule["type"].as_str().unwrap_or(""))
    };
    if !valid_type {
        return Err("schema type".into());
    }
    if let Some(expected) = rule.get("const") {
        if value != expected && !(integer(value).is_some() && integer(value) == integer(expected)) {
            return Err("schema const".into());
        }
    }
    if let Some(allowed) = rule["enum"].as_array() {
        if !allowed
            .iter()
            .any(|a| a == value || (integer(value).is_some() && integer(a) == integer(value)))
        {
            return Err("schema enum".into());
        }
    }
    if let Some(number) = integer(value) {
        if rule["minimum"].as_u64().is_some_and(|n| number < n)
            || rule["maximum"].as_u64().is_some_and(|n| number > n)
        {
            return Err("schema bounds".into());
        }
    }
    if let Some(text) = value.as_str() {
        let length = text.chars().count() as u64;
        if rule["minLength"].as_u64().is_some_and(|n| length < n)
            || rule["maxLength"].as_u64().is_some_and(|n| length > n)
        {
            return Err("schema string length".into());
        }
        if let Some(p) = rule["pattern"].as_str() {
            if !pattern(text, p) {
                return Err("schema pattern".into());
            }
        }
    }
    if let Some(items) = value.as_array() {
        let length = items.len() as u64;
        if rule["minItems"].as_u64().is_some_and(|n| length < n)
            || rule["maxItems"].as_u64().is_some_and(|n| length > n)
        {
            return Err("schema array bounds".into());
        }
        if rule["uniqueItems"] == true {
            for (index, item) in items.iter().enumerate() {
                if items[..index].contains(item) {
                    return Err("schema unique".into());
                }
            }
        }
        for item in items {
            structural(item, &rule["items"])?;
        }
    }
    if let Some(fields) = value.as_object() {
        for required in rule["required"].as_array().ok_or("invalid schema")? {
            if !fields.contains_key(required.as_str().ok_or("invalid schema")?) {
                return Err("schema required".into());
            }
        }
        for (key, field) in fields {
            let property = rule["properties"].get(key).ok_or("schema unknown field")?;
            structural(field, property)?;
        }
    }
    Ok(())
}

pub fn resolve_ranges(text: &str, count: u32, parity: &str) -> Result<Vec<u32>, String> {
    if !(1..=10000).contains(&count)
        || text.is_empty()
        || text.len() > 512
        || !["all", "odd", "even"].contains(&parity)
    {
        return Err("invalid selection".into());
    }
    let mut pages = BTreeSet::new();
    fn positive(text: &str) -> Result<u32, String> {
        if text.is_empty() || text.starts_with('0') || !text.bytes().all(|b| b.is_ascii_digit()) {
            return Err("invalid range grammar".into());
        }
        text.parse().map_err(|_| "range overflow".into())
    }
    for item in text.split(',') {
        let bounds: Vec<&str> = item.split('-').collect();
        if bounds.len() > 2 {
            return Err("invalid range grammar".into());
        }
        let start = positive(bounds[0])?;
        let end = if bounds.len() == 2 {
            if bounds[1].is_empty() {
                count
            } else {
                positive(bounds[1])?
            }
        } else {
            start
        };
        if start > end || end > count {
            return Err("range outside document".into());
        }
        pages.extend(start..=end);
    }
    let result: Vec<_> = pages
        .into_iter()
        .filter(|p| parity == "all" || p % 2 == u32::from(parity == "odd"))
        .collect();
    if result.is_empty() {
        return Err("empty selection".into());
    }
    Ok(result)
}

fn canonical(value: &Value) -> Value {
    match value {
        Value::Array(items) => Value::Array(items.iter().map(canonical).collect()),
        Value::Object(fields) => {
            let sorted: BTreeMap<_, _> = fields
                .iter()
                .map(|(k, v)| (k.clone(), canonical(v)))
                .collect();
            Value::Object(sorted.into_iter().collect())
        }
        Value::Number(_) => integer(value).map_or_else(|| value.clone(), |n| json!(n)),
        _ => value.clone(),
    }
}

pub fn render_hash(plan: &Value, normalized: &Value) -> Result<String, String> {
    let recipe = canonical(
        &json!({"files":plan.get("files").ok_or("files missing")?,"settings":plan.get("settings").ok_or("settings missing")?,"sides":normalized.get("sides").ok_or("sides missing")?}),
    );
    let bytes = serde_json::to_vec(&recipe).map_err(|e| e.to_string())?;
    Ok(format!("{:x}", Sha256::digest(bytes)))
}

pub fn validate(plan: &Value, expected_shop: &str) -> Result<Value, String> {
    let schema: Value =
        serde_json::from_str(include_str!("../../schema.v1.json")).map_err(|e| e.to_string())?;
    structural(plan, &schema)?;
    if plan["shop_id"].as_str() != Some(expected_shop) {
        return Err("tenant mismatch".into());
    }
    let s = &plan["settings"];
    let c = &plan["capabilities"];
    if s["booklet"] == true || !s["photo"].is_null() || !s["bin_id"].is_null() {
        return Err("unsupported executable operation".into());
    }
    let dimensions = match s["paper_size"].as_str().unwrap() {
        "A3" => (297000, 420000),
        "A4" => (210000, 297000),
        "A5" => (148000, 210000),
        "Letter" => (215900, 279400),
        "Legal" => (215900, 355600),
        _ => return Err("paper size".into()),
    };
    let width = integer(&s["width_um"]).unwrap();
    let height = integer(&s["height_um"]).unwrap();
    if (width, height) != dimensions {
        return Err("named paper dimensions mismatch".into());
    }
    let m = &s["margins_um"];
    let (oriented_width, oriented_height) = if s["orientation"] == "landscape" {
        (height, width)
    } else {
        (width, height)
    };
    if integer(&m["left"]).unwrap() + integer(&m["right"]).unwrap() >= oriented_width
        || integer(&m["top"]).unwrap() + integer(&m["bottom"]).unwrap() >= oriented_height
    {
        return Err("margins leave no area".into());
    }
    for (requested, supported) in [
        ("color", "color_modes"),
        ("duplex", "duplex_modes"),
        ("paper_size", "paper_sizes"),
        ("media", "media"),
    ] {
        if !c[supported].as_array().unwrap().contains(&s[requested]) {
            return Err(format!("capability mismatch: {requested}"));
        }
    }
    let copies = integer(&s["copies"]).unwrap() as usize;
    if copies > integer(&c["max_copies"]).unwrap() as usize {
        return Err("copy capability".into());
    }
    let files = plan["files"].as_array().unwrap();
    let mut ids = BTreeSet::new();
    let mut selected = Vec::new();
    for f in files {
        if !ids.insert(f["file_id"].as_str().unwrap()) {
            return Err("duplicate file identity".into());
        }
        selected.push(resolve_ranges(
            f["range"].as_str().unwrap(),
            integer(&f["page_count"]).unwrap() as u32,
            f["parity"].as_str().unwrap(),
        )?);
    }
    let logical = selected.iter().map(Vec::len).sum::<usize>() * copies;
    if logical > LIMIT {
        return Err("logical impression limit".into());
    }
    let duplex = s["duplex"] != "simplex";
    let nup = integer(&s["pages_per_sheet"]).unwrap() as usize;
    let mut templates = Vec::new();
    for pages in &selected {
        let mut units: Vec<Vec<u32>> = pages.chunks(nup).map(|chunk| chunk.to_vec()).collect();
        if duplex && !units.len().is_multiple_of(2) {
            units.push(vec![]);
        }
        templates.push(units);
    }
    let mut sides = Vec::new();
    let mut append = |index: usize, pages: &[u32], copy: usize| -> Result<(), String> {
        if sides.len() >= LIMIT {
            return Err("rendered side limit".into());
        }
        sides.push(json!({"file_index":index,"page_numbers":pages,"copy_index":copy,"blank":pages.is_empty()}));
        Ok(())
    };
    if s["collate"] == true {
        for copy in 0..copies {
            for (index, units) in templates.iter().enumerate() {
                for pages in units {
                    append(index, pages, copy)?;
                }
            }
        }
    } else {
        for (index, units) in templates.iter().enumerate() {
            for sheet in units.chunks(if duplex { 2 } else { 1 }) {
                for copy in 0..copies {
                    for pages in sheet {
                        append(index, pages, copy)?;
                    }
                }
            }
        }
    }
    let padding = sides.iter().filter(|side| side["blank"] == true).count();
    let normalized = json!({"selected_pages":selected,"sides":sides,"logical_pages":logical,"marked_sides":sides.len()-padding,"padding_sides":padding,"physical_sheets":sides.len() / if duplex {2} else {1}});
    if plan["render_hash"].as_str() != Some(render_hash(plan, &normalized)?.as_str()) {
        return Err("render recipe hash mismatch".into());
    }
    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn shared_fixtures() {
        let cases: Value =
            serde_json::from_str(include_str!("../../../../fixtures/printplan/cases.json"))
                .unwrap();
        for case in cases.as_array().unwrap() {
            let result = validate(&case["plan"], case["expected_shop"].as_str().unwrap());
            if let Some(expected) = case.get("expected") {
                assert_eq!(
                    &result.unwrap_or_else(|e| panic!("{}: {e}", case["name"])),
                    expected,
                    "{}",
                    case["name"]
                );
            } else {
                assert!(result.is_err(), "{}", case["name"]);
            }
        }
    }
    #[test]
    fn ranges() {
        assert_eq!(
            resolve_ranges("1-3,5,8-", 10, "even").unwrap(),
            vec![2, 8, 10]
        );
        for text in [
            "0", "3-1", "11", "1,,3", "-3", "01", "1-11", "1-2-3", " 1", "1,", "١",
        ] {
            assert!(resolve_ranges(text, 10, "all").is_err());
        }
    }
    #[test]
    fn malformed_unicode_is_rejected_by_json_parser() {
        assert!(serde_json::from_str::<Value>(r#"{"media":"\ud800"}"#).is_err());
    }
}
