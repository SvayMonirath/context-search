use crate::traits::{Connector, ConnectorError, ConnectorRecord, ConnectorState, SyncResult};
use chrono::Utc;
use std::collections::HashMap;

pub struct ConnectorManager {
    connectors: HashMap<String, Box<dyn Connector>>,
    states: HashMap<String, ConnectorState>,
}

impl ConnectorManager {
    pub fn new() -> Self {
        Self {
            connectors: HashMap::new(),
            states: HashMap::new(),
        }
    }

    /// Registers a connector instance with initial or restored state
    pub fn register(&mut self, connector: Box<dyn Connector>, initial_state: Option<ConnectorState>) {
        let name = connector.name().to_string();
        let state = initial_state.unwrap_or_else(|| ConnectorState {
            connector_name: name.clone(),
            watermark: None,
            last_sync_time: None,
            total_synced_records: 0,
            is_active: true,
        });

        self.connectors.insert(name.clone(), connector);
        self.states.insert(name, state);
    }

    /// Syncs a specific connector by name and updates its watermarked state
    pub fn sync(&mut self, name: &str) -> Result<Vec<ConnectorRecord>, ConnectorError> {
        let connector = self
            .connectors
            .get_mut(name)
            .ok_or_else(|| ConnectorError::Parse(format!("Connector '{}' not registered", name)))?;

        let state = self.states.entry(name.to_string()).or_default();
        let sync_result: SyncResult = connector.sync(state)?;

        // Update state with new cursor
        state.watermark = sync_result.new_watermark;
        state.last_sync_time = Some(Utc::now());
        state.total_synced_records += sync_result.records_added;

        Ok(sync_result.records)
    }

    /// Syncs all registered connectors in sequence
    pub fn sync_all(&mut self) -> HashMap<String, Result<Vec<ConnectorRecord>, ConnectorError>> {
        let mut results = HashMap::new();
        let names: Vec<String> = self.connectors.keys().cloned().collect();

        for name in names {
            let res = self.sync(&name);
            results.insert(name, res);
        }

        results
    }

    /// Retrieves status snapshots for all registered connectors
    pub fn get_statuses(&self) -> Vec<ConnectorState> {
        self.states.values().cloned().collect()
    }
}
