import React from 'react';
import { Folder, FileText, Image as ImageIcon, File, Trash2, ExternalLink, HardDrive } from 'lucide-react';

export default function ShelfWidget({ isCompact, shelvedItems = [], onRemoveItem, onClearAll, onOpenItem }) {
  const getItemIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon size={14} color="var(--info)" />;
    if (type?.startsWith('text/')) return <FileText size={14} color="var(--ok)" />;
    if (type?.includes('folder')) return <Folder size={14} color="var(--warn)" />;
    return <File size={14} color="var(--text-2)" />;
  };

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={14} color="var(--text-2)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>Shelf</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
          {shelvedItems.length} {shelvedItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={15} color="var(--text-1)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Shelf</div>
            <div style={{ fontSize: 10, color: 'var(--text-2)' }}>
              {shelvedItems.length > 0 ? `${shelvedItems.length} held ${shelvedItems.length === 1 ? 'item' : 'items'}` : 'Drop files here to hold them'}
            </div>
          </div>
        </div>

        {shelvedItems.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onClearAll?.(); }}
            style={{ background: 'var(--surface)', border: '1px solid var(--stroke)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-2)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      {shelvedItems.length === 0 ? (
        <div style={{
          flex: 1, margin: '8px 0', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6,
          border: '1px dashed var(--glass-border-hover)', borderRadius: 10,
          color: 'var(--text-3)', fontSize: 11, fontWeight: 600,
        }}>
          <HardDrive size={16} />
          <span>Drag a file or text onto the island</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none' }}>
          {shelvedItems.map((item, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onOpenItem?.(item);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--stroke)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                {getItemIcon(item.type)}
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name || item.text || `Item ${idx + 1}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink size={12} color="var(--text-3)" />
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveItem?.(idx); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
