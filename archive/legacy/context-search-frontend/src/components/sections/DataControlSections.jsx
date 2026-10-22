// Data Control & Erasure Center — main content sections
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { TrashIcon, CalendarIcon, ChevronDownIcon, SearchIcon } from '../ui/Icons';

export const NODES = [
  { id: 1, sender: 'Sarah\nMitchell', type: 'EMAIL', typeVariant: 'info', source: 'GMAIL / WORK', preview: 'RE: Product Strategy Q4 Review - Attach...' },
  { id: 2, sender: 'Dev Lead\n@Nexus', type: 'TELEGRAM_MESSAGE', typeVariant: 'profile', source: 'NEXUS_MAIN', preview: 'Server deployment failed in production ...' },
  { id: 3, sender: 'Amazon.com', type: 'EMAIL', typeVariant: 'info', source: 'GMAIL / PERSONAL', preview: 'Your order #112-4456-99 has been delive...' },
];

const TOTAL_NODES = 12402;
const PAGE_SIZE = 50;

function FilterSelect({ label, flex }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-mid, #2a2a2a)',
      borderRadius: 4,
      fontSize: 11, letterSpacing: '0.08em',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary, #b3b3b3)',
      cursor: 'pointer', whiteSpace: 'nowrap',
      flex: flex || 'none',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue, #a0c0ff)'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-mid, #2a2a2a)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {label.includes('21/06/2026') && <CalendarIcon style={{ opacity: 0.7 }} />}
        {label}
      </div>
      <ChevronDownIcon style={{ opacity: 0.5 }} />
    </div>
  );
}

function TypeBadge({ type, variant }) {
  const styles = {
    info:    { bg: 'rgba(74, 158, 255, 0.08)',  border: '1px solid rgba(74, 158, 255, 0.25)',  color: '#a0c0ff' },
    profile: { bg: 'rgba(168, 85, 247, 0.1)',  border: '1px solid rgba(168, 85, 247, 0.25)',  color: '#c084fc' },
  };
  const s = styles[variant] || styles.info;

  return (
    <span style={{
      display: 'inline-block',
      background: s.bg, border: s.border, color: s.color,
      fontSize: 9, letterSpacing: '0.12em', padding: '4px 10px',
      borderRadius: 3,
      fontFamily: 'var(--font-mono)',
      fontWeight: 500
    }}>
      {type}
    </span>
  );
}

export function PageTitle() {
  return (
    <div className="animate-fade-up page-title-row" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24, fontWeight: 700,
          color: 'var(--text-primary, #ffffff)',
          letterSpacing: '0.06em',
          margin: 0,
          textTransform: 'uppercase'
        }}>
          DATA CONTROL
        </h1>
      </div>
    </div>
  );
}

export function FilterBox({
  search,
  onSearchChange,
  filters,
  updateFilter,
  onApply,
  onReset,
}) {
  return (
    <div
      className="filter-box"
      style={{
        marginBottom: 16,
        border: "1px solid var(--border-dim, #222)",
        borderRadius: 4,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--bg-surface, #121212)",
      }}
    >
      {/* COMPACT SEARCH */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          height: 36,
          border: "1px solid var(--border-mid, #222)",
          borderRadius: 3,
          background: "rgba(0, 0, 0, 0.3)",
          flex: 1.5,
          position: "relative",
        }}
      >
        <SearchIcon
          style={{ color: "var(--text-muted, #555)", width: 14, height: 14 }}
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter tokens..."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "var(--text-primary, #fff)",
            fontSize: 12,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* SENDER IDENTITY */}
      <input
        placeholder="Sender identity"
        value={filters.sender}
        onChange={(e) => updateFilter("sender", e.target.value)}
        style={{
          flex: 1,
          height: 34,
          padding: "0 12px",
          fontSize: 12,
          border: "1px solid var(--border-mid, #222)",
          borderRadius: 3,
          background: "rgba(0, 0, 0, 0.15)",
          color: "var(--text-primary, #fff)",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* ENUM SELECTION DROPDOWN */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.15)",
          border: "1px solid var(--border-mid, #222)",
          borderRadius: 3,
          height: 34,
          flex: 1,
          padding: "0 12px",
        }}
      >
        <select
          value={filters.type || ""}
          onChange={(e) => updateFilter("type", e.target.value)}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            border: "none",
            color: filters.type
              ? "var(--text-primary, #fff)"
              : "var(--text-muted, #555)",
            fontSize: 12,
            outline: "none",
            fontFamily: "inherit",
            cursor: "pointer",
            WebkitAppearance: "none",
            paddingRight: "16px",
          }}
        >
          <option value="" disabled hidden>
            Asset Type
          </option>
          <option
            value="EMAIL"
            style={{ background: "#121212", color: "#fff" }}
          >
            EMAIL
          </option>
          <option
            value="TELEGRAM_MESSAGE"
            style={{ background: "#121212", color: "#fff" }}
          >
            TELEGRAM_MESSAGE
          </option>
        </select>
        <ChevronDownIcon
          style={{
            position: "absolute",
            right: 12,
            pointerEvents: "none",
            color: "var(--text-muted, #555)",
            width: 12,
            height: 12,
          }}
        />
      </div>

      {/* COMPACT DATES */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1.2 }}>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          style={{
            width: "100%",
            height: 34,
            fontSize: 11,
            padding: "0 8px",
            border: "1px solid var(--border-mid, #222)",
            borderRadius: 3,
            background: "rgba(0, 0, 0, 0.15)",
            color: "var(--text-primary, #fff)",
            outline: "none",
            fontFamily: "var(--font-mono)",
          }}
        />
        <span
          style={{
            color: "#333",
            fontSize: 10,
            fontFamily: "var(--font-mono)",
          }}
        >
          /
        </span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          style={{
            width: "100%",
            height: 34,
            fontSize: 11,
            padding: "0 8px",
            border: "1px solid var(--border-mid, #222)",
            borderRadius: 3,
            background: "rgba(0, 0, 0, 0.15)",
            color: "var(--text-primary, #fff)",
            outline: "none",
            fontFamily: "var(--font-mono)",
          }}
        />
      </div>

      {/* QUICK SYSTEM ACTIONS */}
      <div style={{ display: "flex", gap: 8, paddingLeft: 4 }}>
        <button
          onClick={onReset}
          style={{
            height: 36,
            padding: "0 14px",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.04em",
            background: "transparent",
            color: "var(--text-secondary, #888)",
            border: "1px solid var(--border-mid, #222)",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          RESET
        </button>
        <button
          onClick={onApply}
          style={{
            height: 36,
            padding: "0 14px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            background: "var(--accent-blue, #a0c0ff)",
            color: "#0a0a0a",
            border: "none",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          APPLY
        </button>
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      cursor: "pointer",
      position: 'relative'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          width: 15,
          height: 15,
          accentColor: "var(--accent-purple, #a855f7)",
          cursor: "pointer",
          border: '1px solid #444',
          borderRadius: 3,
          background: 'transparent'
        }}
      />
    </label>
  );
}

export function DataTable({
  nodes,
  selectedIds,
  onToggle,
  onToggleAll,
  onDeleteSelected,
}) {
  const allSelected =
    nodes.length > 0 && nodes.every((n) => selectedIds.has(n.id));

  return (
    <div
      className="animate-fade-up-delay-2 table-scroll"
      style={{ marginBottom: 16, flex: 1, overflowY: "auto" }}
    >
      <div
        style={{
          border: "1px solid var(--border-dim, #222)",
          borderRadius: 4,
          background: "var(--bg-surface-dim, #0d0d0d)",
          overflow: "hidden",
        }}
      >
        {/* ACTION BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 16px",
            background: "rgba(0,0,0,0.3)",
            borderBottom: "1px solid var(--border-dim, #222)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted, #555)",
            }}
          >
            {selectedIds.size} NODES ACTIVE // STAGED FOR PURGE
          </span>
          <button
            onClick={onDeleteSelected}
            disabled={selectedIds.size === 0}
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "5px 12px",
              background: selectedIds.size
                ? "rgba(255, 77, 79, 0.12)"
                : "#141414",
              color: selectedIds.size ? "#ff4d4f" : "#333",
              border: selectedIds.size
                ? "1px solid rgba(255, 77, 79, 0.25)"
                : "1px solid #222",
              borderRadius: 3,
              cursor: selectedIds.size ? "pointer" : "not-allowed",
            }}
          >
            EXECUTE PURGE
          </button>
        </div>

        {/* COMPACT HEADER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1.2fr 2.8fr 130px 1.2fr",
            padding: "10px 8px",
            borderBottom: "1px solid var(--border-dim, #222)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--text-muted, #444)",
            alignItems: "center",
          }}
        >
          <Checkbox checked={allSelected} onChange={() => onToggleAll(nodes)} />
          <span>ORIGIN SENDER</span>
          <span>CONTENT BUFFER</span>
          <span>TYPE PARAM</span>
          <span>SOURCE INGEST</span>
        </div>

        {/* ROWS */}
        {nodes.map((node) => {
          const isRowSelected = selectedIds.has(node.id);
          return (
            <div
              key={node.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1.2fr 2.8fr 130px 1.2fr",
                padding: "12px 8px",
                borderBottom: "1px solid var(--border-dim, #1a1a1a)",
                alignItems: "center",
                gap: "12px",
                background: isRowSelected
                  ? "rgba(168, 85, 247, 0.02)"
                  : "transparent",
              }}
            >
              <Checkbox
                checked={isRowSelected}
                onChange={() => onToggle(node.id)}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "#fff",
                  whiteSpace: "pre-line",
                  lineHeight: 1.3,
                  overflow: "hidden",
                }}
              >
                {node.sender}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#999",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {node.preview}
              </span>
              <div>
                <TypeBadge type={node.type} variant={node.typeVariant} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "#555",
                }}
              >
                {node.source}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PaginationBar({ page = 1, limit = 25, total = 0, profileId = '' }) {
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const goToPage = (newPage) => {
    navigate(`/dashboard/data-control?profileId=${profileId}&page=${newPage}&limit=${limit}`);
  };

  return (
    <div style={{
      padding: '16px 20px',
      border: '1px solid var(--border-dim, #222)',
      borderRadius: 6,
      background: 'var(--bg-surface, #141414)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted, #666)', lineHeight: 1.5 }}>
        SHOWING {start}—{end} <span style={{ color: '#444' }}>/</span> OF {total.toLocaleString()}
      </span>

      <div style={{ display: 'flex', border: '1px solid var(--border-mid, #2a2a2a)', borderRadius: 4, overflow: 'hidden', background: '#0a0a0a' }}>
        <button
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          style={{
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            background: 'transparent',
            color: page <= 1 ? '#333' : 'var(--text-primary, #fff)',
            opacity: page <= 1 ? 0.3 : 1,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            border: 'none',
            borderRight: '1px solid var(--border-mid, #2a2a2a)'
          }}
        >
          PREV
        </button>

        <div style={{
          padding: '8px 16px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary, #b3b3b3)',
          display: 'flex',
          alignItems: 'center'
        }}>
          {page} <span style={{ color: '#444', margin: '0 6px' }}>/</span> {totalPages}
        </div>

        <button
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          style={{
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            background: 'transparent',
            color: page >= totalPages ? '#333' : 'var(--text-primary, #fff)',
            opacity: page >= totalPages ? 0.3 : 1,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            border: 'none',
            borderLeft: '1px solid var(--border-mid, #2a2a2a)'
          }}
        >
          NEXT
        </button>
      </div>

      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted, #666)', textAlign: 'right' }}>
        PAGE SIZE<br /><span style={{ color: 'var(--text-secondary, #b3b3b3)' }}>{limit} items</span>
      </span>
    </div>
  );
}

export function MemoryControlRules({
  ruleType,
  setRuleType,
  ruleScope,
  setRuleScope,
  ruleValues,
  addValueField,
  updateValueField,
  removeValueField,
  onCreateRule,
  rules,
  onDeleteRule,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.12em",
        marginBottom: 24,
      }}>
        MEMORY CONTROL RULES
      </div>

      <div style={{
        border: "1px solid var(--border-dim, #222)",
        borderRadius: 6,
        padding: 20,
        marginBottom: 24,
        background: 'var(--bg-surface, #141414)'
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-muted, #555)",
          letterSpacing: "0.12em",
          marginBottom: 16,
        }}>
          CREATE NEW COMPLIANCE RULE
        </div>

        {/* RULE TYPE DROPDOWN CONTAINER */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary, #b3b3b3)", letterSpacing: "0.05em", marginBottom: 8 }}>
            RULE TYPE
          </div>
          <div style={{
            padding: "0 12px",
            border: "1px solid var(--border-mid, #2a2a2a)",
            borderRadius: 4,
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary, #fff)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                outline: "none",
                width: "100%",
                height: "38px",
                cursor: "pointer",
                WebkitAppearance: "none"
              }}
            >
              <option value="BLOCK_SENDER">Block Sender</option>
              <option value="BLOCK_CHAT">Block Chat</option>
              <option value="BLOCK_INTEGRATION">Block Integration</option>
              <option value="BLOCK_KEYWORD">Block Keyword</option>
            </select>
            <ChevronDownIcon style={{ pointerEvents: 'none', color: '#666', marginLeft: -20 }} />
          </div>
        </div>

        {/* VALUES INPUT FIELDS */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary, #b3b3b3)", letterSpacing: "0.05em", marginBottom: 8 }}>
            RULE ARGS / VALUE OBJECTS
          </div>

          {ruleValues.map((value, index) => (
            <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={value}
                onChange={(e) => updateValueField(index, e.target.value)}
                placeholder="Ex: @domain.com or keyword token"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid var(--border-mid, #2a2a2a)",
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.1)",
                  color: "var(--text-primary, #fff)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />

              {ruleValues.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeValueField(index)}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-dim, #222)",
                    borderRadius: 4,
                    color: "var(--text-muted, #666)",
                    cursor: "pointer",
                    fontSize: 16,
                    width: 34,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4f'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addValueField}
            style={{
              marginTop: 6,
              padding: "8px 14px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.02em",
              background: "rgba(74, 158, 255, 0.05)",
              color: "var(--accent-blue, #a0c0ff)",
              border: "1px solid rgba(74, 158, 255, 0.2)",
              borderRadius: 4,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(74, 158, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(74, 158, 255, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(74, 158, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(74, 158, 255, 0.2)";
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add Target Line
          </button>
        </div>

        {/* SCOPE SELECTOR */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary, #b3b3b3)", letterSpacing: "0.05em", marginBottom: 10 }}>
            PIPELINE TARGET SCOPE
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 11, color: "var(--text-secondary, #b3b3b3)" }}>
            {['INGESTION', 'RETRIEVAL', 'BOTH'].map((sc) => (
              <label key={sc} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textTransform: 'capitalize' }}>
                <input
                  type="radio"
                  name="scope"
                  value={sc}
                  checked={ruleScope === sc}
                  onChange={() => setRuleScope(sc)}
                  style={{ accentColor: "var(--accent-blue, #a0c0ff)" }}
                />
                {sc.toLowerCase()}
              </label>
            ))}
          </div>
        </div>

        <Button
          style={{
            width: "100%",
            background: "var(--accent-blue, #a0c0ff)",
            color: "#0a0a0a",
            border: "none",
            borderRadius: 4,
            padding: "12px",
            fontSize: 11,
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
          onClick={onCreateRule}
        >
          ADD RULE
        </Button>
      </div>

      {/* ACTIVE RULES TRACK */}
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: "var(--text-muted, #555)",
        letterSpacing: "0.12em",
        marginBottom: 16,
      }}>
        ACTIVE SYSTEM RULES ({rules.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            type={rule.type}
            value={rule.value.join(", ")}
            scope={rule.scope}
            active={rule.isActive}
            deleteRule={() => onDeleteRule(rule.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ type, value, scope, active, deleteRule }) {
  return (
    <div style={{
      border: '1px solid var(--border-dim, #222)',
      borderRadius: 6,
      padding: 16,
      background: 'var(--bg-surface-dim, #111)',
      position: 'relative'
    }}>
      <button style={{
        position: 'absolute', top: 16, right: 16,
        background: 'none', border: 'none',
        color: 'var(--text-muted, #444)', cursor: 'pointer',
        transition: 'color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4f'}
      onMouseLeave={(e) => e.currentTarget.style.color = '#444'}
      onClick={deleteRule}
      >
        <TrashIcon size={14} />
      </button>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#555', letterSpacing: '0.05em', marginBottom: 6 }}>{type}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #fff)', marginBottom: 12, maxWidth: '90%' }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)', padding: '3px 8px',
          background: 'rgba(0,0,0,0.3)', border: '1px solid #222', borderRadius: 3,
          color: 'var(--text-muted, #777)'
        }}>
          SCOPE: {scope}
        </span>
        <div style={{
          width: 28, height: 14, borderRadius: 7,
          background: active ? 'rgba(74, 158, 255, 0.2)' : '#222',
          border: active ? '1px solid rgba(74, 158, 255, 0.4)' : '1px solid #333',
          position: 'relative', cursor: 'pointer'
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: active ? 'var(--accent-blue, #a0c0ff)' : '#555',
            position: 'absolute', top: 1, left: active ? 15 : 1,
            transition: 'all 0.15s ease'
          }} />
        </div>
      </div>
    </div>
  );
}

export function useNodeSelection(nodes) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');

  const filtered = nodes.filter(n =>
    !search || n.sender.toLowerCase().includes(search.toLowerCase()) ||
    n.preview.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (items) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = items.every((n) => next.has(n.id));
      if (allSelected) {
        items.forEach((n) => next.delete(n.id));
      } else {
        items.forEach((n) => next.add(n.id));
      }
      return next;
    });
  };

  const allSelected = filtered.length > 0 && filtered.every(n => selectedIds.has(n.id));

  return { selectedIds, search, setSearch, filtered, toggle, toggleAll, allSelected };
}
