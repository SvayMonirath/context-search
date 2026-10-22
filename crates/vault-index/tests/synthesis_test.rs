use chrono::Utc;
use vault_index::{synthesis::synthesize_factual_answer, MatchType, SearchResult};

#[test]
fn test_real_extractive_synthesis() {
    let result1 = SearchResult {
        id: "doc-101".into(),
        source: "Obsidian".into(),
        title: "Q3 Budget & Hiring".into(),
        content: "We scheduled the team offsite for October 12. Approved $45,000 budget for hiring frontend developers. Invoices due by Friday.".into(),
        score: 0.92,
        match_type: MatchType::Keyword,
        timestamp: Utc::now(),
    };

    // Query specifically about the budget
    let synthesis = synthesize_factual_answer("budget hiring", &[result1]);

    // Assert that synthesis extracted the EXACT sentence about the budget
    assert!(synthesis.quoted_excerpt.contains("$45,000"));
    assert!(synthesis.quoted_excerpt.contains("hiring frontend developers"));
    assert_eq!(synthesis.source_title, "Q3 Budget & Hiring");
    assert!(!synthesis.quoted_excerpt.contains("Sarah Jenkins"), "Must NEVER inject fake Sarah Jenkins!");
}

#[test]
fn test_synthesis_empty_results() {
    let synthesis = synthesize_factual_answer("nonexistent query", &[]);
    assert!(synthesis.answer.contains("No matching"));
    assert!(synthesis.source_title.is_empty());
}

#[test]
fn test_synthesis_empty_query() {
    let result = SearchResult {
        id: "doc-1".into(),
        source: "Obsidian".into(),
        title: "Test".into(),
        content: "Some content".into(),
        score: 1.0,
        match_type: MatchType::Exact,
        timestamp: Utc::now(),
    };
    let synthesis = synthesize_factual_answer("", &[result]);
    assert!(synthesis.answer.contains("Type a query"));
}
