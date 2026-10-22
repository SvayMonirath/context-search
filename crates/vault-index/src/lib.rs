use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use thiserror::Error;

pub mod storage;
pub mod synthesis;

#[derive(Error, Debug)]
pub enum IndexError {
    #[error("Document not found: {0}")]
    NotFound(String),
    #[error("Vector dimension mismatch: expected {expected}, got {actual}")]
    DimensionMismatch { expected: usize, actual: usize },
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum MatchType {
    Exact,
    Keyword,
    Semantic,
    Hybrid,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct IndexedDocument {
    pub id: String,
    pub source: String, // e.g. "Gmail", "Obsidian", "Telegram"
    pub title: String,
    pub content: String,
    #[serde(default)]
    pub vector: Vec<f32>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SearchResult {
    pub id: String,
    pub source: String,
    pub title: String,
    pub content: String,
    pub score: f32,
    pub match_type: MatchType,
    pub timestamp: DateTime<Utc>,
}

pub struct HybridIndex {
    docs: HashMap<String, IndexedDocument>,
    inverted_index: HashMap<String, HashSet<String>>,
    term_frequencies: HashMap<String, HashMap<String, usize>>,
    doc_lengths: HashMap<String, usize>,
    total_tokens: usize,
    vector_dim: Option<usize>,
}

impl HybridIndex {
    pub fn new() -> Self {
        Self {
            docs: HashMap::new(),
            inverted_index: HashMap::new(),
            term_frequencies: HashMap::new(),
            doc_lengths: HashMap::new(),
            total_tokens: 0,
            vector_dim: None,
        }
    }

    fn tokenize(text: &str) -> Vec<String> {
        text.to_lowercase()
            .split(|c: char| !c.is_alphanumeric())
            .filter(|s| s.len() >= 2)
            .map(|s| s.to_string())
            .collect()
    }

    fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() || a.is_empty() {
            return 0.0;
        }
        let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

        if norm_a == 0.0 || norm_b == 0.0 {
            0.0
        } else {
            dot / (norm_a * norm_b)
        }
    }

    pub fn insert(&mut self, doc: IndexedDocument) -> Result<(), IndexError> {
        if let Some(dim) = self.vector_dim {
            if doc.vector.len() != dim && !doc.vector.is_empty() {
                return Err(IndexError::DimensionMismatch {
                    expected: dim,
                    actual: doc.vector.len(),
                });
            }
        } else if !doc.vector.is_empty() {
            self.vector_dim = Some(doc.vector.len());
        }

        let tokens = Self::tokenize(&format!("{} {}", doc.title, doc.content));
        let doc_len = tokens.len();
        self.doc_lengths.insert(doc.id.clone(), doc_len);
        self.total_tokens += doc_len;

        for token in &tokens {
            self.inverted_index
                .entry(token.clone())
                .or_default()
                .insert(doc.id.clone());

            *self.term_frequencies
                .entry(token.clone())
                .or_default()
                .entry(doc.id.clone())
                .or_insert(0) += 1;
        }

        self.docs.insert(doc.id.clone(), doc);
        Ok(())
    }

    pub fn len(&self) -> usize {
        self.docs.len()
    }

    pub fn is_empty(&self) -> bool {
        self.docs.is_empty()
    }

    pub fn sources(&self) -> HashSet<String> {
        self.docs.values().map(|d| d.source.clone()).collect()
    }

    pub fn get_document(&self, id: &str) -> Option<&IndexedDocument> {
        self.docs.get(id)
    }

    pub fn all_documents(&self) -> Vec<IndexedDocument> {
        self.docs.values().cloned().collect()
    }

    /// Searches using hybrid fusion: BM25 keyword matching + Cosine vector similarity.
    /// When query is empty and no vector is provided, returns the most recent documents.
    pub fn search(
        &self,
        query: &str,
        query_vector: Option<&[f32]>,
        source_filter: Option<&str>,
        limit: usize,
    ) -> Vec<SearchResult> {
        let query_tokens = Self::tokenize(query);

        // If query is empty and no vector is provided, return recent documents
        if query_tokens.is_empty() && query_vector.is_none() {
            let mut results: Vec<SearchResult> = self.docs.values()
                .filter(|doc| {
                    if let Some(filter) = source_filter {
                        doc.source.to_lowercase() == filter.to_lowercase()
                    } else {
                        true
                    }
                })
                .map(|doc| SearchResult {
                    id: doc.id.clone(),
                    source: doc.source.clone(),
                    title: doc.title.clone(),
                    content: doc.content.clone(),
                    score: 1.0,
                    match_type: MatchType::Exact,
                    timestamp: doc.timestamp,
                })
                .collect();
            results.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            results.truncate(limit);
            return results;
        }

        let mut keyword_scores: HashMap<String, f32> = HashMap::new();

        let total_docs = self.docs.len() as f32;
        let avgdl = if total_docs > 0.0 {
            (self.total_tokens as f32) / total_docs
        } else {
            1.0
        };

        let k1: f32 = 1.2;
        let b: f32 = 0.75;

        // Dedup query tokens so repeated terms don't inflate IDF
        let unique_query_tokens: HashSet<_> = query_tokens.iter().collect();

        // 1. BM25 Keyword Scoring
        for token in unique_query_tokens {
            if let Some(doc_counts) = self.term_frequencies.get(token) {
                let df = doc_counts.len() as f32;
                let idf = ((total_docs - df + 0.5) / (df + 0.5) + 1.0).ln().max(0.01);

                for (id, &count) in doc_counts {
                    let tf = count as f32;
                    let doc_len = self.doc_lengths.get(id).copied().unwrap_or(1) as f32;
                    let tf_component = (tf * (k1 + 1.0)) / (tf + k1 * (1.0 - b + b * (doc_len / avgdl)));
                    let score = idf * tf_component;
                    *keyword_scores.entry(id.clone()).or_insert(0.0) += score;
                }
            }
        }

        // 2. Vector Scoring
        let mut vector_scores: HashMap<String, f32> = HashMap::new();
        if let Some(q_vec) = query_vector {
            for (id, doc) in &self.docs {
                if !doc.vector.is_empty() {
                    let sim = Self::cosine_similarity(q_vec, &doc.vector);
                    if sim > 0.0 {
                        vector_scores.insert(id.clone(), sim);
                    }
                }
            }
        }

        // 3. Reciprocal Rank Fusion (RRF)
        let mut candidate_ids: HashSet<String> = keyword_scores.keys().cloned().collect();
        candidate_ids.extend(vector_scores.keys().cloned());

        let mut results = Vec::new();
        for id in candidate_ids {
            let doc = match self.docs.get(&id) {
                Some(d) => d,
                None => continue,
            };

            if let Some(filter) = source_filter {
                if doc.source.to_lowercase() != filter.to_lowercase() {
                    continue;
                }
            }

            let kw_score = keyword_scores.get(&id).cloned().unwrap_or(0.0);
            let vec_score = vector_scores.get(&id).cloned().unwrap_or(0.0);

            // Normalized RRF score
            let rrf_score = if vec_score > 0.0 && kw_score > 0.0 {
                (kw_score / (kw_score + 1.0)) * 0.5 + vec_score * 0.5
            } else if kw_score > 0.0 {
                kw_score / (kw_score + 1.0)
            } else {
                vec_score
            };

            let match_type = if kw_score > 0.0 && vec_score > 0.6 {
                MatchType::Hybrid
            } else if kw_score > 0.0 {
                MatchType::Keyword
            } else {
                MatchType::Semantic
            };

            results.push(SearchResult {
                id: doc.id.clone(),
                source: doc.source.clone(),
                title: doc.title.clone(),
                content: doc.content.clone(),
                score: rrf_score,
                match_type,
                timestamp: doc.timestamp,
            });
        }

        // Sort by score descending
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(limit);
        results
    }
}

impl Default for HybridIndex {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hybrid_search_ranking() {
        let mut index = HybridIndex::new();

        let doc1 = IndexedDocument {
            id: "doc-1".into(),
            source: "Gmail".into(),
            title: "SOW Agreement Final - Redesign Budget".into(),
            content: "We agreed on $12,500 total fee with 40/30/30 milestones.".into(),
            vector: vec![0.1, 0.8, 0.5, 0.2],
            timestamp: Utc::now(),
        };

        let doc2 = IndexedDocument {
            id: "doc-2".into(),
            source: "Obsidian".into(),
            title: "Dinner plans in Tokyo".into(),
            content: "Reservation at Fuunji ramen for Friday 7:30pm.".into(),
            vector: vec![0.9, 0.1, 0.0, 0.3],
            timestamp: Utc::now(),
        };

        index.insert(doc1).unwrap();
        index.insert(doc2).unwrap();

        assert_eq!(index.len(), 2);

        // Keyword query
        let query_vec = vec![0.15, 0.75, 0.45, 0.22];
        let results = index.search("redesign budget $12,500", Some(&query_vec), None, 5);

        assert!(!results.is_empty());
        assert_eq!(results[0].id, "doc-1");
        assert_eq!(results[0].source, "Gmail");
        assert!(results[0].score > 0.5);
    }

    #[test]
    fn test_source_filtering() {
        let mut index = HybridIndex::new();

        index.insert(IndexedDocument {
            id: "gmail-1".into(),
            source: "Gmail".into(),
            title: "Invoice 1".into(),
            content: "Invoice for design sprint".into(),
            vector: vec![],
            timestamp: Utc::now(),
        }).unwrap();

        index.insert(IndexedDocument {
            id: "notes-1".into(),
            source: "Obsidian".into(),
            title: "Invoice Note".into(),
            content: "Invoice paid wire transfer".into(),
            vector: vec![],
            timestamp: Utc::now(),
        }).unwrap();

        let filtered = index.search("invoice", None, Some("Obsidian"), 10);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].id, "notes-1");
    }

    #[test]
    fn test_bm25_length_normalization_and_rare_terms() {
        let mut index = HybridIndex::new();

        // Doc A: Concise, high density (5 tokens total)
        index.insert(IndexedDocument {
            id: "concise".into(),
            source: "Notes".into(),
            title: "Quantum Ledger".into(),
            content: "Quantum cryptographic state validation".into(),
            vector: vec![],
            timestamp: Utc::now(),
        }).unwrap();

        // Doc B: Long, low density (quantum diluted by 40 other words)
        index.insert(IndexedDocument {
            id: "diluted".into(),
            source: "Notes".into(),
            title: "General Architecture".into(),
            content: "Today we had a standard engineering sync meeting to discuss general frontend layout rules and database options with quantum mechanics mentioned in passing as an analogy for state synchronization.".into(),
            vector: vec![],
            timestamp: Utc::now(),
        }).unwrap();

        let results = index.search("quantum", None, None, 5);
        assert_eq!(results.len(), 2);
        // BM25 penalizes diluted document length: concise document must rank #1
        assert_eq!(results[0].id, "concise");
        assert!(results[0].score > results[1].score);
    }

    #[test]
    fn test_empty_query_returns_recents() {
        let mut index = HybridIndex::new();
        let now = Utc::now();

        index.insert(IndexedDocument {
            id: "old".into(),
            source: "Gmail".into(),
            title: "Older Note".into(),
            content: "Some older text".into(),
            vector: vec![],
            timestamp: now - chrono::Duration::hours(2),
        }).unwrap();

        index.insert(IndexedDocument {
            id: "new".into(),
            source: "Obsidian".into(),
            title: "Newer Note".into(),
            content: "Some newer text".into(),
            vector: vec![],
            timestamp: now,
        }).unwrap();

        let all_recents = index.search("", None, None, 10);
        assert_eq!(all_recents.len(), 2);
        assert_eq!(all_recents[0].id, "new");

        let filtered = index.search("", None, Some("Gmail"), 10);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].id, "old");
    }
}
