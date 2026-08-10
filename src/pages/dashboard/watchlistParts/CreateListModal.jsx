import Modal from './Modal';
import Field from './Field';
import { G } from './styles';

export default function CreateListModal({
  createList, newList, setNewList, setShowCreate,
}) {
  return (
        <Modal title="Create New Watchlist" onClose={() => setShowCreate(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="List Name">
              <input value={newList.name} onChange={e => setNewList(p => ({ ...p, name: e.target.value }))} placeholder="e.g. AI Priority Watch Q3 2025" />
            </Field>
            <Field label="Description">
              <input value={newList.description} onChange={e => setNewList(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this list's purpose" />
            </Field>
            <Field label="Visibility">
              <select value={newList.visibility} onChange={e => setNewList(p => ({ ...p, visibility: e.target.value }))}>
                <option value="public">Public</option>
                <option value="internal">Internal (OpenI only)</option>
                <option value="restricted">Restricted</option>
              </select>
            </Field>
            <Field label="Tags (comma separated)">
              <input value={newList.tags} onChange={e => setNewList(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. AI, priority, Q3-2025" />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={createList} style={{ padding: '8px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Create</button>
            </div>
          </div>
        </Modal>
  );
}
