import React, { useState, useEffect } from 'react';
import { History, Save, ArrowLeft, Columns } from 'lucide-react';
import { documentService } from '../services/api';

export default function DocumentEditor({ documentId, onBack }) {
  const [docData, setDocData] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [viewMode, setViewMode] = useState('edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const response = await documentService.getOne(documentId);
      if (response.data) {
        setDocData(response.data);
        const sorted = [...response.data.versions].sort((a, b) => b.version_number - a.version_number);
        const latest = sorted[0];
        setSelectedVersion(latest);
        setCurrentContent(latest ? latest.content : '');
      }
    } catch (error) {
      console.error('Error retrieving historical log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!currentContent.trim()) return;

    try {
      setSaving(true);
      await documentService.appendVersion(documentId, {
        content: currentContent,
        commit_message: commitMessage.trim() || `Incremental update v${docData.versions.length + 1}`,
      });
      setCommitMessage('');
      await fetchDocumentDetails();
    } catch (error) {
      console.error('Failed executing append commit:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPreviousVersionContent = () => {
    if (!selectedVersion || selectedVersion.version_number === 1) return '';
    const prev = docData.versions.find((v) => v.version_number === selectedVersion.version_number - 1);
    return prev ? prev.content : '';
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">Synchronizing document stream...</div>;
  }

  if (!docData) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">Workspace data corrupt or unreadable.</div>;
  }

  const isLatest = selectedVersion?.version_number === docData.versions.length;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        <ArrowLeft />
        Back to Dashboard
      </button>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Document Editor</p>
            <h2 className="text-2xl font-semibold text-slate-900">{docData.title}</h2>
            <p className="text-sm text-slate-500">Active Commit Focus: v{selectedVersion?.version_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'edit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'diff' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Line Diff
            </button>
          </div>
        </div>

        {viewMode === 'edit' ? (
          <div className="space-y-4">
            <textarea
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              disabled={!isLatest}
              placeholder="# Markdown Header supported..."
              className="min-h-[320px] w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {isLatest ? (
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <input
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe this document change log update (optional)..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleCommit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Save size={16} />
                  {saving ? 'Staging...' : 'Commit Change'}
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-slate-700">
                Viewing read-only snapshot tree history. Changes are restricted to the head version branch.
                <button
                  onClick={() => {
                    const latest = [...docData.versions].sort((a, b) => b.version_number - a.version_number)[0];
                    setSelectedVersion(latest);
                    setCurrentContent(latest.content);
                    setViewMode('edit');
                  }}
                  className="ml-2 font-semibold text-blue-600 underline"
                >
                  Reset to Head (v{docData.versions.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <History size={18} />
                Preceding Version (v{selectedVersion.version_number - 1 || 0})
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700">{getPreviousVersionContent() || '--- Empty Baseline Configuration ---'}</pre>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Columns size={18} />
                Selected View Target (v{selectedVersion.version_number})
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700">{selectedVersion.content}</pre>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Commit History Log</p>
            <h3 className="text-lg font-semibold text-slate-900">Version timeline</h3>
          </div>
        </div>

        <div className="grid gap-3">
          {[...docData.versions]
            .sort((a, b) => b.version_number - a.version_number)
            .map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setSelectedVersion(v);
                  setCurrentContent(v.content);
                  setViewMode('edit');
                }}
                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                  selectedVersion?.id === v.id
                    ? 'border-blue-500 bg-blue-50 text-slate-900'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">v{v.version_number}</span>
                  <span className="text-xs text-slate-500">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{v.commit_message || `Save point #${v.version_number}`}</p>
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
