use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum PiiType {
    CreditCard,
    SocialSecurityNumber,
    PhoneNumber,
    ApiKey,
    IbanOrRouting,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct RedactionEvent {
    pub pii_type: PiiType,
    pub original_length: usize,
    pub timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RedactedText {
    pub text: String,
    pub events: Vec<RedactionEvent>,
}

pub struct PiiScrubber;

impl PiiScrubber {
    fn ssn_regex() -> &'static Regex {
        static RE: OnceLock<Regex> = OnceLock::new();
        RE.get_or_init(|| Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap())
    }

    fn phone_regex() -> &'static Regex {
        static RE: OnceLock<Regex> = OnceLock::new();
        RE.get_or_init(|| {
            Regex::new(r"(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b").unwrap()
        })
    }

    fn api_key_regex() -> &'static Regex {
        static RE: OnceLock<Regex> = OnceLock::new();
        RE.get_or_init(|| {
            Regex::new(r"(AKIA[0-9A-Z]{16})|(sk-[a-zA-Z0-9_-]{20,})|(ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})").unwrap()
        })
    }

    fn iban_regex() -> &'static Regex {
        static RE: OnceLock<Regex> = OnceLock::new();
        RE.get_or_init(|| Regex::new(r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b").unwrap())
    }

    fn credit_card_regex() -> &'static Regex {
        static RE: OnceLock<Regex> = OnceLock::new();
        RE.get_or_init(|| Regex::new(r"\b(?:\d{4}[ -]?){3}\d{1,4}\b|\b\d{13,19}\b").unwrap())
    }

    /// Validates whether a candidate number string satisfies the Luhn formula.
    fn passes_luhn(digits: &str) -> bool {
        let clean: String = digits.chars().filter(|c| c.is_ascii_digit()).collect();
        if clean.len() < 13 || clean.len() > 19 {
            return false;
        }

        let mut sum = 0;
        let mut alt = false;
        for c in clean.chars().rev() {
            if let Some(mut n) = c.to_digit(10) {
                if alt {
                    n *= 2;
                    if n > 9 {
                        n -= 9;
                    }
                }
                sum += n;
                alt = !alt;
            } else {
                return false;
            }
        }
        sum % 10 == 0
    }

    /// Redacts all detected PII entities deterministically.
    pub fn scrub(input: &str) -> RedactedText {
        let mut result = input.to_string();
        let mut events = Vec::new();

        // 1. Scrub API Keys
        for cap in Self::api_key_regex().find_iter(input) {
            events.push(RedactionEvent {
                pii_type: PiiType::ApiKey,
                original_length: cap.as_str().len(),
                timestamp: Utc::now(),
            });
        }
        result = Self::api_key_regex().replace_all(&result, "[REDACTED_API_KEY]").to_string();

        // 2. Scrub SSNs
        for cap in Self::ssn_regex().find_iter(&result) {
            events.push(RedactionEvent {
                pii_type: PiiType::SocialSecurityNumber,
                original_length: cap.as_str().len(),
                timestamp: Utc::now(),
            });
        }
        result = Self::ssn_regex().replace_all(&result, "[REDACTED_SSN]").to_string();

        // 3. Scrub IBANs / Bank routing
        for cap in Self::iban_regex().find_iter(&result) {
            events.push(RedactionEvent {
                pii_type: PiiType::IbanOrRouting,
                original_length: cap.as_str().len(),
                timestamp: Utc::now(),
            });
        }
        result = Self::iban_regex().replace_all(&result, "[REDACTED_BANK_ID]").to_string();

        // 4. Scrub Credit Cards (validated with Luhn)
        let mut cc_matches = Vec::new();
        for m in Self::credit_card_regex().find_iter(&result) {
            let matched_str = m.as_str();
            if Self::passes_luhn(matched_str) {
                cc_matches.push(matched_str.to_string());
                events.push(RedactionEvent {
                    pii_type: PiiType::CreditCard,
                    original_length: matched_str.len(),
                    timestamp: Utc::now(),
                });
            }
        }
        for cc in cc_matches {
            result = result.replace(&cc, "[REDACTED_CREDIT_CARD]");
        }

        // 5. Scrub Phone Numbers
        for cap in Self::phone_regex().find_iter(&result) {
            let s = cap.as_str();
            let digits_count = s.chars().filter(|c| c.is_ascii_digit()).count();
            if digits_count >= 7 && digits_count <= 15 {
                events.push(RedactionEvent {
                    pii_type: PiiType::PhoneNumber,
                    original_length: s.len(),
                    timestamp: Utc::now(),
                });
            }
        }
        // Apply phone redaction carefully to avoid destroying non-phone numbers
        let phone_re = Self::phone_regex();
        result = phone_re.replace_all(&result, |caps: &regex::Captures| {
            let matched = &caps[0];
            let digits_count = matched.chars().filter(|c| c.is_ascii_digit()).count();
            if digits_count >= 7 && digits_count <= 15 && !matched.contains('[') {
                "[REDACTED_PHONE]".to_string()
            } else {
                matched.to_string()
            }
        }).to_string();

        RedactedText {
            text: result,
            events,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scrubs_phone_and_ssn() {
        let input = "Hello, my phone is +1-555-839-2910 and my SSN is 123-45-6789. Please keep it safe.";
        let redacted = PiiScrubber::scrub(input);

        assert!(!redacted.text.contains("+1-555-839-2910"));
        assert!(!redacted.text.contains("123-45-6789"));
        assert!(redacted.text.contains("[REDACTED_PHONE]"));
        assert!(redacted.text.contains("[REDACTED_SSN]"));
        assert_eq!(redacted.events.len(), 2);
    }

    #[test]
    fn test_scrubs_api_key() {
        let input = "Use this AWS token AKIAIOSFODNN7EXAMPLE or OpenAI key sk-abcdef12345678901234567890 to authenticate.";
        let redacted = PiiScrubber::scrub(input);

        assert!(!redacted.text.contains("AKIAIOSFODNN7EXAMPLE"));
        assert!(!redacted.text.contains("sk-abcdef12345678901234567890"));
        assert!(redacted.text.contains("[REDACTED_API_KEY]"));
    }

    #[test]
    fn test_scrubs_valid_credit_card_via_luhn() {
        // Standard Visa test card (passes Luhn check)
        let input = "Please charge my Visa card 4532 0150 0000 0007 for the invoice.";
        let redacted = PiiScrubber::scrub(input);

        assert!(!redacted.text.contains("4532 0150 0000 0007"));
        assert!(redacted.text.contains("[REDACTED_CREDIT_CARD]"));
    }

    #[test]
    fn test_preserves_innocent_dates_and_numbers() {
        let input = "We met on 2026-03-14 and agreed on $12,500 total.";
        let redacted = PiiScrubber::scrub(input);

        assert!(redacted.text.contains("2026-03-14"));
        assert!(redacted.text.contains("$12,500"));
    }
}
