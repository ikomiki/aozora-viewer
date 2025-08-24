import Layout from './components/Layout/Layout'
import './App.css'

function App() {
  return (
    <Layout>
      <div className="app-content">
        <div className="welcome-section">
          <h2>ファイルをドロップして開始</h2>
          <div className="dropzone">
            <p>ここに青空文庫形式のテキストファイルをドロップしてください</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App