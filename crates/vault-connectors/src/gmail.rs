use crate::traits::{Connector, ConnectorError, ConnectorRecord, ConnectorState, SyncResult};
use chrono::{DateTime, Utc};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::collections::HashMap;
use std::time::Duration;
use vault_pii::PiiScrubber;

pub struct GmailConnector {
    pub access_token: Option<String>,
    pub client: Client,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct GmailListResponse {
    #[serde(default)]
    messages: Vec<GmailMessageRef>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    result_size_estimate: Option<u64>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct GmailMessageRef {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: Option<String>,
}

#[derive(Deserialize, Debug)]
struct GmailMessageDetail {
    id: String,
    #[serde(rename = "snippet")]
    snippet: Option<String>,
    payload: Option<GmailPayload>,
    #[serde(rename = "internalDate")]
    internal_date: Option<String>,
}

#[derive(Deserialize, Debug)]
struct GmailPayload {
    headers: Option<Vec<GmailHeader>>,
    body: Option<GmailBody>,
    parts: Option<Vec<GmailPayloadPart>>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct GmailPayloadPart {
    #[serde(rename = "mimeType")]
    mime_type: Option<String>,
    body: Option<GmailBody>,
    parts: Option<Vec<GmailPayloadPart>>,
}

#[derive(Deserialize, Debug)]
struct GmailHeader {
    name: String,
    value: String,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct GmailBody {
    data: Option<String>,
    size: Option<u64>,
}

impl GmailConnector {
    pub fn new(access_token: Option<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            access_token,
            client,
        }
    }

    pub fn parse_email(
        id: &str,
        subject: &str,
        from: &str,
        body: &str,
        timestamp: DateTime<Utc>,
    ) -> crate::ParsedDocument {
        let scrubbed = PiiScrubber::scrub(body);

        crate::ParsedDocument {
            id: format!("gmail_{}", id),
            source: "Gmail".into(),
            title: subject.to_string(),
            content: scrubbed.text,
            sender: Some(from.to_string()),
            timestamp,
            pii_events_count: scrubbed.events.len(),
        }
    }

    /// Decodes base64url encoded Gmail message bodies (RFC 4648)
    pub fn decode_base64_url(encoded: &str) -> Option<String> {
        let normalized = encoded.replace('-', "+").replace('_', "/");
        let padded = match normalized.len() % 4 {
            2 => format!("{}==", normalized),
            3 => format!("{}=", normalized),
            _ => normalized,
        };

        if let Ok(bytes) = base64_decode(&padded) {
            String::from_utf8(bytes).ok()
        } else {
            None
        }
    }

    /// Recursively extracts plain text from Gmail payload parts
    fn extract_plain_text(payload: &GmailPayload) -> String {
        // Direct body
        if let Some(body) = &payload.body {
            if let Some(data) = &body.data {
                if let Some(text) = Self::decode_base64_url(data) {
                    if !text.trim().is_empty() {
                        return text;
                    }
                }
            }
        }

        // Parts traversal (prefer text/plain)
        if let Some(parts) = &payload.parts {
            for part in parts {
                if part.mime_type.as_deref() == Some("text/plain") {
                    if let Some(b) = &part.body {
                        if let Some(d) = &b.data {
                            if let Some(text) = Self::decode_base64_url(d) {
                                return text;
                            }
                        }
                    }
                }
            }

            // Fallback to text/html stripped of tags if no text/plain found
            for part in parts {
                if part.mime_type.as_deref() == Some("text/html") {
                    if let Some(b) = &part.body {
                        if let Some(d) = &b.data {
                            if let Some(html) = Self::decode_base64_url(d) {
                                return strip_html_tags(&html);
                            }
                        }
                    }
                }
            }
        }

        String::new()
    }
}

impl Connector for GmailConnector {
    fn name(&self) -> &'static str {
        "Gmail"
    }

    fn validate_config(&self) -> Result<(), ConnectorError> {
        match &self.access_token {
            Some(token) if !token.trim().is_empty() => Ok(()),
            _ => Err(ConnectorError::Auth(
                "Gmail OAuth2 access token is missing or empty.".into(),
            )),
        }
    }

    fn sync(&mut self, state: &ConnectorState) -> Result<SyncResult, ConnectorError> {
        self.validate_config()?;
        let token = self.access_token.as_ref().unwrap();

        // Incremental sync via watermark query
        let mut query = "category:primary OR category:updates".to_string();
        if let Some(wm) = &state.watermark {
            query.push_str(&format!(" after:{}", wm));
        }

        let list_url = format!(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q={}",
            urlencoding::encode(&query)
        );

        let resp = self
            .client
            .get(&list_url)
            .bearer_auth(token)
            .send()
            .map_err(|e| ConnectorError::Http(e.to_string()))?;

        if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
            return Err(ConnectorError::Auth("Gmail OAuth token has expired or is invalid.".into()));
        }

        if !resp.status().is_success() {
            return Err(ConnectorError::Http(format!(
                "Gmail API returned status {}: {}",
                resp.status(),
                resp.text().unwrap_or_default()
            )));
        }

        let list_data: GmailListResponse = resp
            .json()
            .map_err(ConnectorError::Reqwest)?;

        let mut records = Vec::new();
        let mut latest_internal_date: Option<u64> = None;

        for msg_ref in list_data.messages {
            let detail_url = format!(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/{}",
                msg_ref.id
            );

            let detail_resp = match self
                .client
                .get(&detail_url)
                .bearer_auth(token)
                .send()
            {
                Ok(r) if r.status().is_success() => r,
                _ => continue,
            };

            let detail: GmailMessageDetail = match detail_resp.json() {
                Ok(d) => d,
                Err(_) => continue,
            };

            let internal_date_millis = detail
                .internal_date
                .as_deref()
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(0);

            if latest_internal_date.map_or(true, |cur| internal_date_millis > cur) {
                latest_internal_date = Some(internal_date_millis);
            }

            let timestamp = DateTime::from_timestamp_millis(internal_date_millis as i64)
                .unwrap_or_else(Utc::now);

            let mut subject = "No Subject".to_string();
            let mut from = "Unknown Sender".to_string();
            let mut metadata = HashMap::new();

            if let Some(payload) = &detail.payload {
                if let Some(headers) = &payload.headers {
                    for h in headers {
                        let name_lower = h.name.to_lowercase();
                        if name_lower == "subject" {
                            subject = h.value.clone();
                        } else if name_lower == "from" {
                            from = h.value.clone();
                        } else if name_lower == "to" {
                            metadata.insert("to".to_string(), h.value.clone());
                        }
                    }
                }

                let body_text = Self::extract_plain_text(payload);
                let final_body = if !body_text.trim().is_empty() {
                    body_text
                } else {
                    detail.snippet.unwrap_or_default()
                };

                // Scrub PII on device
                let scrubbed = PiiScrubber::scrub(&final_body);
                metadata.insert("gmail_id".to_string(), detail.id.clone());
                metadata.insert("pii_scrubbed".to_string(), scrubbed.events.len().to_string());

                records.push(ConnectorRecord {
                    id: format!("gmail_{}", detail.id),
                    source: "Gmail".to_string(),
                    title: subject,
                    content: scrubbed.text,
                    sender: Some(from),
                    timestamp,
                    metadata,
                });
            }
        }

        // New watermark as Unix epoch seconds
        let new_watermark = latest_internal_date.map(|m| (m / 1000).to_string());
        let records_added = records.len();

        Ok(SyncResult {
            records,
            new_watermark,
            records_added,
            records_skipped: 0,
        })
    }
}

fn strip_html_tags(html: &str) -> String {
    let mut output = String::with_capacity(html.len());
    let mut in_tag = false;

    for ch in html.chars() {
        if ch == '<' {
            in_tag = true;
        } else if ch == '>' {
            in_tag = false;
        } else if !in_tag {
            output.push(ch);
        }
    }
    output
}

fn base64_decode(input: &str) -> Result<Vec<u8>, ()> {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut table_map = [255u8; 256];
    for (i, &b) in TABLE.iter().enumerate() {
        table_map[b as usize] = i as u8;
    }

    let input_bytes = input.as_bytes();
    let mut out = Vec::with_capacity(input_bytes.len() * 3 / 4);
    let mut buffer = 0u32;
    let mut bits = 0;

    for &b in input_bytes {
        if b == b'=' {
            break;
        }
        let val = table_map[b as usize];
        if val == 255 {
            continue; // ignore whitespace/newline
        }
        buffer = (buffer << 6) | (val as u32);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buffer >> bits) as u8);
        }
    }

    Ok(out)
}

mod urlencoding {
    pub fn encode(input: &str) -> String {
        let mut encoded = String::with_capacity(input.len() * 3);
        for byte in input.bytes() {
            if byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_' || byte == b'.' || byte == b'~' {
                encoded.push(byte as char);
            } else {
                encoded.push_str(&format!("%{:02X}", byte));
            }
        }
        encoded
    }
}
