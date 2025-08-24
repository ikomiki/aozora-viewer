import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>青空文庫ビューワ</h1>
        <p>青空文庫形式のテキストファイルを美しく表示します。</p>
      </header>
      <main>
        <div className="dropzone">
          <p>ここにテキストファイルをドロップしてください</p>
        </div>
      </main>
    </div>
  )
}

export default App