use serde::{Deserialize, Serialize};
use crate::SearchResult;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct FactSynthesis {
    pub answer: String,
    pub quoted_excerpt: String,
    pub source_title: String,
    pub source_sender: String,
    pub source_date: String,
}

/// Tokenizes text into lowercase alphanumeric keywords.
fn extract_tokens(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| s.len() >= 2)
        .map(|s| s.to_string())
        .collect()
}

/// Synthesizes an evidence-backed factual answer by ranking sentences
/// within top retrieved search results using token overlap scoring.
pub fn synthesize_factual_answer(query: &str, results: &[SearchResult]) -> FactSynthesis {
    if query.trim().is_empty() {
        return FactSynthesis {
            answer: "Type a query in the search bar to recall verified evidence from your vault.".into(),
            quoted_excerpt: "".into(),
            source_title: "".into(),
            source_sender: "".into(),
            source_date: "".into(),
        };
    }

    if results.is_empty() {
        return FactSynthesis {
            answer: "No matching records found in the vault.".into(),
            quoted_excerpt: "".into(),
            source_title: "".into(),
            source_sender: "".into(),
            source_date: "".into(),
        };
    }

    let query_tokens = extract_tokens(query);
    let top_doc = &results[0];

    // Split document into sentences
    let sentences: Vec<&str> = top_doc
        .content
        .split(|c: char| c == '.' || c == '\n' || c == '?' || c == '!')
        .map(|s| s.trim())
        .filter(|s| s.len() > 10)
        .collect();

    // Score sentences by query token matches (only accepting positive scores)
    let mut best_sentence = "";
    let mut best_score = 0;

    for sentence in &sentences {
        if sentence.to_lowercase().starts_with("from:") {
            continue;
        }
        let s_tokens = extract_tokens(sentence);
        let mut score = 0;
        for q in &query_tokens {
            if s_tokens.contains(q) {
                score += 10;
            }
        }
        if score > best_score {
            best_score = score;
            best_sentence = sentence;
        }
    }

    let excerpt = if !best_sentence.is_empty() {
        best_sentence.to_string()
    } else {
        // Fallback: first non-header informative sentence or first 200 chars
        sentences
            .iter()
            .find(|s| !s.to_lowercase().starts_with("from:") && s.len() > 20)
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                if top_doc.content.len() > 200 {
                    format!("{}...", &top_doc.content[..200].trim())
                } else {
                    top_doc.content.trim().to_string()
                }
            })
    };

    // Extract sender if present in content ("From: Alice <alice@...>") or fallback to source
    let sender = if let Some(from_line) = top_doc.content.lines().find(|l| l.to_lowercase().starts_with("from:")) {
        from_line.trim_start_matches("From:").trim().to_string()
    } else {
        top_doc.source.clone()
    };

    let answer = format!("According to verified record \"{}\": \"{}\"", top_doc.title, excerpt);

    FactSynthesis {
        answer,
        quoted_excerpt: excerpt,
        source_title: top_doc.title.clone(),
        source_sender: sender,
        source_date: top_doc.timestamp.format("%B %d, %Y at %l:%M %p").to_string(),
    }
}
