import React from 'react';
import { Folder, FileText, Image as ImageIcon, File, Trash2, ExternalLink, HardDrive, Plus } from 'lucide-react';

const DEFAULT_SAMPLE_ITEMS = [
  { name: 'Downloads Folder', type: 'folder', path: 'C:\\Users\\sahil\\Downloads' },
  { name: 'Documents Folder', type: 'folder', path: 'C:\\Users\\sahil\\Documents' },
  { name: 'System Temp Clip', type: 'text/plain', name: 'Quick Text Note.txt', text: 'Sample WinLand Shelf Note' }
];

export default function ShelfWidget({ isCompact, shelvedItems = [], onRemoveItem, onClearAll, onOpenItem, onAddItem }) {
  const displayItems = shelvedItems.length > 0 ? shelvedItems : DEFAULT_SAMPLE_ITEMS;

  const getItemIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon size={14} color="#3b82f6" />;
    if (type?.startsWith('text/')) return <FileText size={14} color="#10b981" />;
    if (type?.includes('folder')) return <Folder size={14} color="#f59e0b" />;
    return <File size={14} color="#a855f7" />;
  };

  if (isCompact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={14} color="#a855f7" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Shelf</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7' }}>
          {displayItems.length} {displayItems.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={15} color="#a855f7" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Quick Shelf</div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.55)' }}>
              {displayItems.length} active holding items
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {shelvedItems.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearAll?.(); }}
              style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: 6, padding: '4px 8px', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none' }}>
        {displayItems.map((item, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onOpenItem?.(item);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              {getItemIcon(item.type)}
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name || item.text || `Item ${idx + 1}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={12} color="rgba(255,255,255,0.6)" />
              {shelvedItems.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveItem?.(idx); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
