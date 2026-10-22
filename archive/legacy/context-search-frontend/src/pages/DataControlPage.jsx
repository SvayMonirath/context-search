// Data Control & Erasure Center — Archives > MEMORY_NODES
import DashboardShell from '../components/layout/DashboardShell';
import { useSearchParams } from 'react-router-dom';
import { useCommunication } from '../hook/communication.hook';
import { useMemory } from '../hook/memory.hook';
import {
  NODES,
  PageTitle,
  FilterBox,
  DataTable,
  PaginationBar,
  MemoryControlRules,
  useNodeSelection,
} from '../components/sections/DataControlSections';
import { useEffect, useState } from 'react';

export default function DataControlPage() {
  const {
    selectedIds, search, setSearch,
    toggle, toggleAll,
  } = useNodeSelection(NODES);

  const [nodes, setNodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 50;
  const profileId = searchParams.get('profileId') || '';

  const { getCommunications } = useCommunication();
  const { searchMemory, deleteMemoryNode, createMemoryRule, getMemoryRules, deleteMemoryRule } = useMemory();

  const [filters, setFilters] = useState({
    sender: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });

  const [rules, setRules] = useState([]);

  const mapNodes = (items) =>
    (items || []).map((item) => ({
      id: item.id,
      sender: item.sender,
      preview: item.content?.slice(0, 80) || "",
      type: item.type,
      typeVariant: item.type === "EMAIL" ? "info" : "profile",
      source: item.integration?.type || "UNKNOWN",
    }));

  const loadDefault = async () => {
    if (!profileId) return;

    setLoading(true);

    const res = await getCommunications(profileId, page, limit);

    if (res?.data) {
      setNodes(mapNodes(res.data.communications));
      setTotal(res.data.total || 0);
    }

    setLoading(false);
  };

  const runSearch = async () => {
    if (!profileId) return;

    setLoading(true);

    const hasFilters =
      search.trim() ||
      filters.sender ||
      filters.type ||
      filters.dateFrom ||
      filters.dateTo;

    // fallback to normal list
    if (!hasFilters) {
      await loadDefault();
      return;
    }

    const res = await searchMemory(
      profileId,
      search || undefined,
      {
        sender: filters.sender || undefined,
        type: filters.type || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
      limit,
      (page - 1) * limit
    );

    if (res?.data) {
      setNodes(mapNodes(res.data));
      setTotal(res.data.length || 0); // backend doesn't return total here
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDefault();
  }, [profileId, page, limit]);

  useEffect(() => {
    const t = setTimeout(() => {
      runSearch();
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  const onDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    await deleteMemoryNode(ids, profileId);
    setNodes(prev => prev.filter(n => !selectedIds.has(n.id)));
  };

  const [ruleType, setRuleType] = useState("BLOCK_SENDER");
  const [ruleScope, setRuleScope] = useState("BOTH");
  const [ruleValues, setRuleValues] = useState([""]);

  // Add these missing handlers:
  const addValueField = () => {
    setRuleValues(prev => [...prev, ""]);
  };

  const updateValueField = (index, value) => {
    setRuleValues(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeValueField = (index) => {
    setRuleValues(prev => prev.filter((_, i) => i !== index));
  };

  const loadRules = async () => {
    if (!profileId) return;
    const res = await getMemoryRules(profileId);
    if (res?.data) setRules(res.data);
  };

  useEffect(() => {
    loadRules();
  }, [profileId]);

  const handleDeleteRule = async (rule_id) => {
    if (!profileId || !rule_id) return;

    await deleteMemoryRule(profileId, rule_id);
    loadRules();
  };

  const handleCreateRule = async () => {
    const values = ruleValues.filter(v => v.trim());
    if (!values.length || !profileId) return;

    await createMemoryRule(profileId, ruleType, ruleScope, values);

    setRuleValues([""]);
    loadRules();
  };

  // -----------------------------
  // FILTER HANDLERS (NEW)
  // -----------------------------
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setSearch("");
    setFilters({
      sender: "",
      type: "",
      dateFrom: "",
      dateTo: "",
    });

    loadDefault();
  };

  // -----------------------------
  // APPLY BUTTON TRIGGER
  // -----------------------------
  const applyFilters = () => {
    runSearch();
  };

  return (
    <DashboardShell mainStyle={{ padding: 0, height: "100%", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "100%" }}>

        {/* LEFT */}
        <div style={{
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border-dim)",
          overflowY: "auto",
          marginLeft: 210,
        }}>
          <PageTitle />

          <FilterBox
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            updateFilter={updateFilter}
            onApply={applyFilters}
            onReset={resetFilters}
          />

          <DataTable
            nodes={nodes}
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onDeleteSelected={onDeleteSelected}
          />

          <PaginationBar
            page={page}
            limit={limit}
            total={total}
            profileId={profileId}
          />
        </div>

        {/* RIGHT */}
{/* RIGHT */}
<div style={{ padding: "28px 24px", overflowY: "auto" }}>
  <MemoryControlRules
    ruleType={ruleType}
    setRuleType={setRuleType}
    ruleScope={ruleScope}
    setRuleScope={setRuleScope}
    ruleValues={ruleValues}
    addValueField={addValueField}
    updateValueField={updateValueField}
    removeValueField={removeValueField}
    onCreateRule={handleCreateRule}
    rules={rules}
    onDeleteRule={handleDeleteRule}
  />
</div>

      </div>
    </DashboardShell>
  );
}
