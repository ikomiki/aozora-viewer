import { useState } from 'react'
import Layout from './components/Layout/Layout'
import DropZone from './components/DropZone/DropZone'
import DocumentRenderer from './components/DocumentRenderer/DocumentRenderer'
import AozoraParser from './lib/parser/AozoraParser'
import type { ParsedDocument } from './types'
import './App.css'

function App() {
  const [document, setDocument] = useState<ParsedDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileLoad = (content: string, filename: string) => {
    try {
      setError(null)
      const parser = new AozoraParser()
      const parsedDocument = parser.parse(content, filename)
      
      setDocument(parsedDocument)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの解析に失敗しました')
      setDocument(null)
    }
  }

  const handleError = (message: string) => {
    setError(message)
    setDocument(null)
  }

  const handleNewDocument = () => {
    setDocument(null)
    setError(null)
  }

  return (
    <Layout>
      <div className="app-content">
        {document ? (
          <div className="document-view">
            <div className="document-header">
              <button 
                className="new-document-button"
                onClick={handleNewDocument}
                type="button"
              >
                📄 新しいドキュメント
              </button>
              <h1>{document.title}</h1>
            </div>
            <DocumentRenderer document={document} />
          </div>
        ) : (
          <div className="welcome-section">
            <h2>ファイルをドロップして開始</h2>
            <DropZone 
              onFileLoad={handleFileLoad}
              onError={handleError}
              maxFileSize={50 * 1024 * 1024} // 50MB
              acceptedFileTypes={['text/plain', 'text/html']}
            />
            {error && (
              <div className="error-message" role="alert">
                ❌ {error}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App