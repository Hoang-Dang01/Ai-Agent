import React, { useState, useEffect } from 'react';
import { FileText, Clock, Plus } from 'lucide-react';
import DocumentEditor from '../features/DocumentEditor';
import { documentService } from '../services/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAll();
      setDocuments(response.data);
    } catch (e) {
      console.error(e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    const title = prompt('Enter document title:');
    if (!title) return;

    try {
      await documentService.create({
        title,
        initial_content: '# New Document\nStart writing...',
        commit_message: 'Initial workspace generation',
      });
      loadDocuments();
    } catch (error) {
      console.error('Error generating initial document model', error);
    }
  };

  if (activeDocId) {
    return (
      <DocumentEditor
        documentId={activeDocId}
        onBack={() => {
          setActiveDocId(null);
          loadDocuments();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace Dashboard</p>
            <h2 className="text-3xl font-semibold">Manage your document repository</h2>
          </div>
          <button
            onClick={handleCreateDocument}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <Plus size={16} /> New Document
          </button>
        </div>
        <p className="text-sm text-slate-600">Manage knowledge bases and historical version control chains.</p>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">Accessing vector network records...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className="group text-left rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                  <FileText size={20} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {doc.versions?.length || 0} versions
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{doc.title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Updated {new Date(doc.updated_at).toLocaleDateString()} · {doc.versions?.length || 0} versions
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
