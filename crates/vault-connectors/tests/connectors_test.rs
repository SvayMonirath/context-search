use std::fs;
use tempfile::tempdir;
use vault_connectors::traits::{Connector, ConnectorState};
use vault_connectors::{
    ObsidianConnector, TelegramConnector, NotionConnector, ConnectorManager,
    NotionBlock, NotionRichTextBlock, NotionRichTextItem, NotionCodeBlock, NotionToDoBlock
};

#[test]
fn test_obsidian_wikilink_and_frontmatter_cleaning() {
    let raw = r#"---
title: Project Architecture Overview
tags: [rust, security, local-first]
author: Security Team
---

# Project Architecture Overview

We are integrating with [[User Authentication System|AuthModule]] for local tokens.
See also [[Database Migrations]] and [[API Spec|v2 Documentation]].
Ensure API key is protected: sk-live-9823482348293842398423.
"#;

    let (body, metadata) = ObsidianConnector::parse_frontmatter(raw);
    assert_eq!(metadata.get("title").map(|s| s.as_str()), Some("Project Architecture Overview"));
    assert_eq!(metadata.get("author").map(|s| s.as_str()), Some("Security Team"));

    let cleaned = ObsidianConnector::clean_wikilinks(&body);
    assert!(cleaned.contains("AuthModule"));
    assert!(cleaned.contains("Database Migrations"));
    assert!(cleaned.contains("v2 Documentation"));
    assert!(!cleaned.contains("[["));
    assert!(!cleaned.contains("]]"));
}

#[test]
fn test_obsidian_folder_incremental_sync_and_pii_scrub() {
    let dir = tempdir().unwrap();
    let note1_path = dir.path().join("first_note.md");
    let note2_path = dir.path().join("secret_keys.md");

    fs::write(
        &note1_path,
        "# Daily Notes\nCompleted performance audit of SQLite database.\n",
    )
    .unwrap();

    fs::write(
        &note2_path,
        "# Secret Notes\nCustomer card: 4532-0150-0000-0007 and phone +1-555-839-2910.\n",
    )
    .unwrap();

    let mut connector = ObsidianConnector::new(dir.path());
    let state = ConnectorState::default();

    let sync_res = connector.sync(&state).expect("Sync should succeed");
    assert_eq!(sync_res.records_added, 2);
    assert!(sync_res.new_watermark.is_some());

    // Verify PII scrubbing occurred on secret_keys.md
    let secret_rec = sync_res
        .records
        .iter()
        .find(|r| r.title == "Secret Notes")
        .expect("Secret Notes record should exist");
    assert!(secret_rec.content.contains("[REDACTED_CREDIT_CARD]"));
    assert!(secret_rec.content.contains("[REDACTED_PHONE]"));
    assert!(!secret_rec.content.contains("4532-0150-0000-0007"));

    // Second sync with existing watermark should skip unchanged files
    let mut state2 = ConnectorState::default();
    state2.watermark = sync_res.new_watermark;
    let sync_res2 = connector.sync(&state2).expect("Second sync should succeed");
    assert_eq!(sync_res2.records_added, 0);
    assert_eq!(sync_res2.records_skipped, 2);
}

#[test]
fn test_notion_block_flattener() {
    let blocks = vec![
        NotionBlock {
            block_type: "heading_1".to_string(),
            heading_1: Some(NotionRichTextBlock {
                rich_text: vec![NotionRichTextItem {
                    plain_text: Some("Sprint Objectives".to_string()),
                }],
            }),
            paragraph: None,
            heading_2: None,
            heading_3: None,
            bulleted_list_item: None,
            numbered_list_item: None,
            to_do: None,
            code: None,
            quote: None,
        },
        NotionBlock {
            block_type: "paragraph".to_string(),
            heading_1: None,
            paragraph: Some(NotionRichTextBlock {
                rich_text: vec![NotionRichTextItem {
                    plain_text: Some("Deliver sovereign memory search on macOS.".to_string()),
                }],
            }),
            heading_2: None,
            heading_3: None,
            bulleted_list_item: None,
            numbered_list_item: None,
            to_do: None,
            code: None,
            quote: None,
        },
        NotionBlock {
            block_type: "to_do".to_string(),
            heading_1: None,
            paragraph: None,
            heading_2: None,
            heading_3: None,
            bulleted_list_item: None,
            numbered_list_item: None,
            to_do: Some(NotionToDoBlock {
                rich_text: vec![NotionRichTextItem {
                    plain_text: Some("Fix BM25 length normalization".to_string()),
                }],
                checked: true,
            }),
            code: None,
            quote: None,
        },
        NotionBlock {
            block_type: "code".to_string(),
            heading_1: None,
            paragraph: None,
            heading_2: None,
            heading_3: None,
            bulleted_list_item: None,
            numbered_list_item: None,
            to_do: None,
            code: Some(NotionCodeBlock {
                rich_text: vec![NotionRichTextItem {
                    plain_text: Some("fn main() { println!(\"OK\"); }".to_string()),
                }],
                language: Some("rust".to_string()),
            }),
            quote: None,
        },
    ];

    let markdown = NotionConnector::flatten_blocks(&blocks);
    assert!(markdown.contains("# Sprint Objectives"));
    assert!(markdown.contains("Deliver sovereign memory search on macOS."));
    assert!(markdown.contains("- [x] Fix BM25 length normalization"));
    assert!(markdown.contains("```rust\nfn main() { println!(\"OK\"); }\n```"));
}

#[test]
fn test_telegram_continuous_deduplication_sync() {
    let dir = tempdir().unwrap();
    let export_file = dir.path().join("result.json");

    let initial_json = r#"{
        "name": "Dev Team",
        "type": "group_chat",
        "messages": [
            {
                "id": 1,
                "date": "2026-10-14T10:00:00Z",
                "from": "Marcus",
                "text": "Staging server deployed successfully."
            },
            {
                "id": 2,
                "date": "2026-10-14T10:05:00Z",
                "from": "Elena",
                "text": "All integration tests are passing."
            }
        ]
    }"#;

    fs::write(&export_file, initial_json).unwrap();

    let mut connector = TelegramConnector::new(&export_file);
    let state = ConnectorState::default();

    let sync_1 = connector.sync(&state).unwrap();
    assert_eq!(sync_1.records_added, 2);
    assert_eq!(sync_1.records_skipped, 0);

    // Re-syncing without changes should skip 2 messages
    let mut state_2 = ConnectorState::default();
    state_2.watermark = sync_1.new_watermark;
    let sync_2 = connector.sync(&state_2).unwrap();
    assert_eq!(sync_2.records_added, 0);
    assert_eq!(sync_2.records_skipped, 2);

    // Append message 3 to export file
    let updated_json = r#"{
        "name": "Dev Team",
        "type": "group_chat",
        "messages": [
            {
                "id": 1,
                "date": "2026-10-14T10:00:00Z",
                "from": "Marcus",
                "text": "Staging server deployed successfully."
            },
            {
                "id": 2,
                "date": "2026-10-14T10:05:00Z",
                "from": "Elena",
                "text": "All integration tests are passing."
            },
            {
                "id": 3,
                "date": "2026-10-14T10:15:00Z",
                "from": "Alex",
                "text": "Promoting release v2.0.0 to production."
            }
        ]
    }"#;
    fs::write(&export_file, updated_json).unwrap();

    let mut state_3 = ConnectorState::default();
    state_3.watermark = sync_2.new_watermark;
    let sync_3 = connector.sync(&state_3).unwrap();
    assert_eq!(sync_3.records_added, 1);
    assert_eq!(sync_3.records_skipped, 2);
    assert_eq!(sync_3.records[0].content, "Promoting release v2.0.0 to production.");
}

#[test]
fn test_connector_manager_orchestration() {
    let dir = tempdir().unwrap();
    let note_path = dir.path().join("task.md");
    fs::write(&note_path, "# Task\nFinish implementing connector pipeline.\n").unwrap();

    let mut manager = ConnectorManager::new();
    let obsidian = Box::new(ObsidianConnector::new(dir.path()));
    manager.register(obsidian, None);

    let statuses = manager.get_statuses();
    assert_eq!(statuses.len(), 1);
    assert_eq!(statuses[0].connector_name, "Obsidian");
    assert_eq!(statuses[0].total_synced_records, 0);

    let synced = manager.sync("Obsidian").unwrap();
    assert_eq!(synced.len(), 1);
    assert_eq!(synced[0].title, "Task");

    let statuses_after = manager.get_statuses();
    assert_eq!(statuses_after[0].total_synced_records, 1);
    assert!(statuses_after[0].last_sync_time.is_some());
}
