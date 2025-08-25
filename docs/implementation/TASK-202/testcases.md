# TASK-202: 設定パネル実装 - テストケース

## 1. useDocumentSettings フック テストケース

### 1.1 初期状態テスト
```typescript
describe('useDocumentSettings - 初期状態', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('デフォルト設定値で初期化される', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    expect(result.current.settings).toEqual({
      fontSize: 16,
      lineHeight: 1.6,
      horizontalMargin: 20,
      letterSpacing: 0,
      paragraphSpacing: 16
    });
  });

  it('localStorageから設定を復元する', () => {
    localStorage.setItem('aozora-settings-fontSize', '20');
    localStorage.setItem('aozora-settings-lineHeight', '1.8');
    localStorage.setItem('aozora-settings-horizontalMargin', '30');
    
    const { result } = renderHook(() => useDocumentSettings());
    
    expect(result.current.settings.fontSize).toBe(20);
    expect(result.current.settings.lineHeight).toBe(1.8);
    expect(result.current.settings.horizontalMargin).toBe(30);
  });

  it('不正なlocalStorage値はデフォルト値を使用', () => {
    localStorage.setItem('aozora-settings-fontSize', 'invalid');
    localStorage.setItem('aozora-settings-lineHeight', 'null');
    localStorage.setItem('aozora-settings-horizontalMargin', '999');
    
    const { result } = renderHook(() => useDocumentSettings());
    
    expect(result.current.settings.fontSize).toBe(16); // デフォルト
    expect(result.current.settings.lineHeight).toBe(1.6); // デフォルト
    expect(result.current.settings.horizontalMargin).toBe(200); // 最大値にクランプ
  });
});
```

### 1.2 設定変更テスト
```typescript
describe('useDocumentSettings - 設定変更', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updateSetting で設定が更新される', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 20);
    });
    
    expect(result.current.settings.fontSize).toBe(20);
  });

  it('範囲外の値は自動的にクランプされる', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 50); // 最大36を超過
      result.current.updateSetting('lineHeight', 0.5); // 最小1.2未満
    });
    
    expect(result.current.settings.fontSize).toBe(36);
    expect(result.current.settings.lineHeight).toBe(1.2);
  });

  it('デバウンス後にlocalStorageに保存される', async () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 18);
    });
    
    // デバウンス前はまだ保存されない
    expect(localStorage.getItem('aozora-settings-fontSize')).toBeNull();
    
    // デバウンス時間経過
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(localStorage.getItem('aozora-settings-fontSize')).toBe('18');
  });

  it('resetToDefaults で全設定がリセットされる', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 24);
      result.current.updateSetting('lineHeight', 2.0);
    });
    
    act(() => {
      result.current.resetToDefaults();
    });
    
    expect(result.current.settings).toEqual({
      fontSize: 16,
      lineHeight: 1.6,
      horizontalMargin: 20,
      letterSpacing: 0,
      paragraphSpacing: 16
    });
  });

  it('resetSetting で個別設定がリセットされる', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 24);
      result.current.updateSetting('lineHeight', 2.0);
    });
    
    act(() => {
      result.current.resetSetting('fontSize');
    });
    
    expect(result.current.settings.fontSize).toBe(16);
    expect(result.current.settings.lineHeight).toBe(2.0); // 他は変更されない
  });
});
```

### 1.3 CSS Variables連携テスト
```typescript
describe('useDocumentSettings - CSS Variables', () => {
  it('設定変更時にCSS変数が更新される', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 20);
      result.current.updateSetting('lineHeight', 1.8);
    });
    
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--document-font-size')).toBe('20px');
    expect(root.style.getPropertyValue('--document-line-height')).toBe('1.8');
  });

  it('リセット時にCSS変数もリセットされる', () => {
    const { result } = renderHook(() => useDocumentSettings());
    
    act(() => {
      result.current.updateSetting('fontSize', 24);
    });
    
    act(() => {
      result.current.resetSetting('fontSize');
    });
    
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--document-font-size')).toBe('16px');
  });
});
```

## 2. SettingSlider コンポーネント テストケース

### 2.1 基本レンダリング
```typescript
describe('SettingSlider - 基本レンダリング', () => {
  const defaultProps = {
    label: 'テスト設定',
    value: 16,
    min: 12,
    max: 36,
    step: 1,
    unit: 'px',
    onChange: vi.fn(),
    onReset: vi.fn()
  };

  it('正しくレンダリングされる', () => {
    render(<SettingSlider {...defaultProps} />);
    
    expect(screen.getByText('テスト設定')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16')).toBeInTheDocument();
    expect(screen.getByText('16px')).toBeInTheDocument();
  });

  it('スライダーの属性が正しく設定される', () => {
    render(<SettingSlider {...defaultProps} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '12');
    expect(slider).toHaveAttribute('max', '36');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveAttribute('value', '16');
  });

  it('リセットボタンが表示される', () => {
    render(<SettingSlider {...defaultProps} />);
    
    const resetButton = screen.getByRole('button', { name: /reset|リセット/i });
    expect(resetButton).toBeInTheDocument();
  });
});
```

### 2.2 操作テスト
```typescript
describe('SettingSlider - 操作', () => {
  const defaultProps = {
    label: 'テスト設定',
    value: 16,
    min: 12,
    max: 36,
    step: 1,
    unit: 'px',
    onChange: vi.fn(),
    onReset: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('スライダー操作でonChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SettingSlider {...defaultProps} onChange={onChange} />);
    
    const slider = screen.getByRole('slider');
    await user.type(slider, '{arrowright}');
    
    expect(onChange).toHaveBeenCalledWith(17);
  });

  it('リセットボタンクリックでonResetが呼ばれる', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    
    render(<SettingSlider {...defaultProps} onReset={onReset} />);
    
    const resetButton = screen.getByRole('button', { name: /reset|リセット/i });
    await user.click(resetButton);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('マウスドラッグでスライダーが操作できる', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SettingSlider {...defaultProps} onChange={onChange} />);
    
    const slider = screen.getByRole('slider');
    
    // マウスドラッグをシミュレート
    await user.pointer([
      { target: slider, coords: { clientX: 100 } },
      { pointerName: 'mouse', target: slider, coords: { clientX: 150 } }
    ]);
    
    expect(onChange).toHaveBeenCalled();
  });
});
```

### 2.3 アクセシビリティテスト
```typescript
describe('SettingSlider - アクセシビリティ', () => {
  const defaultProps = {
    label: 'テスト設定',
    value: 16,
    min: 12,
    max: 36,
    step: 1,
    unit: 'px',
    onChange: vi.fn(),
    onReset: vi.fn()
  };

  it('適切なARIA属性が設定される', () => {
    render(<SettingSlider {...defaultProps} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-label', 'テスト設定');
    expect(slider).toHaveAttribute('aria-valuemin', '12');
    expect(slider).toHaveAttribute('aria-valuemax', '36');
    expect(slider).toHaveAttribute('aria-valuenow', '16');
    expect(slider).toHaveAttribute('aria-valuetext', '16px');
  });

  it('キーボード操作対応', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SettingSlider {...defaultProps} onChange={onChange} />);
    
    const slider = screen.getByRole('slider');
    slider.focus();
    
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(17);
    
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith(15);
    
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenCalledWith(12);
    
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenCalledWith(36);
  });

  it('スクリーンリーダー対応', () => {
    render(<SettingSlider {...defaultProps} />);
    
    const slider = screen.getByRole('slider');
    const label = screen.getByText('テスト設定');
    
    expect(slider).toHaveAttribute('aria-describedby');
    expect(label).toBeInTheDocument();
  });
});
```

## 3. SettingsPanel コンポーネント テストケース

### 3.1 基本レンダリング
```typescript
describe('SettingsPanel - 基本レンダリング', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('全設定項目が表示される', () => {
    render(<SettingsPanel />);
    
    expect(screen.getByText('表示設定')).toBeInTheDocument();
    expect(screen.getByText('文字サイズ')).toBeInTheDocument();
    expect(screen.getByText('行間')).toBeInTheDocument();
    expect(screen.getByText('左右マージン')).toBeInTheDocument();
    expect(screen.getByText('文字間隔')).toBeInTheDocument();
    expect(screen.getByText('段落間隔')).toBeInTheDocument();
  });

  it('全リセットボタンが表示される', () => {
    render(<SettingsPanel />);
    
    const resetAllButton = screen.getByRole('button', { name: /すべてリセット|reset all/i });
    expect(resetAllButton).toBeInTheDocument();
  });

  it('各設定のスライダーが表示される', () => {
    render(<SettingsPanel />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(5); // 5つの設定項目
  });
});
```

### 3.2 設定変更統合テスト
```typescript
describe('SettingsPanel - 設定変更', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('文字サイズ変更が正常に動作する', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    
    await user.type(fontSizeSlider, '{arrowright}{arrowright}');
    
    // 値が変更されることを確認
    expect(fontSizeSlider).toHaveValue('18');
    
    // デバウンス後にlocalStorageに保存される
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(localStorage.getItem('aozora-settings-fontSize')).toBe('18');
  });

  it('全リセットボタンで全設定がリセットされる', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    // いくつかの設定を変更
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    const lineHeightSlider = screen.getByRole('slider', { name: /行間/i });
    
    await user.type(fontSizeSlider, '{arrowright}{arrowright}');
    await user.type(lineHeightSlider, '{arrowright}');
    
    // 全リセット実行
    const resetAllButton = screen.getByRole('button', { name: /すべてリセット|reset all/i });
    await user.click(resetAllButton);
    
    // デフォルト値に戻ることを確認
    expect(fontSizeSlider).toHaveValue('16');
    expect(lineHeightSlider).toHaveValue('1.6');
  });

  it('個別リセットが正常に動作する', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    const lineHeightSlider = screen.getByRole('slider', { name: /行間/i });
    
    // 両方の設定を変更
    await user.type(fontSizeSlider, '{arrowright}{arrowright}');
    await user.type(lineHeightSlider, '{arrowright}');
    
    // 文字サイズのみリセット
    const fontSizeResetButton = screen.getAllByRole('button', { name: /reset|リセット/i })[0];
    await user.click(fontSizeResetButton);
    
    // 文字サイズのみリセットされることを確認
    expect(fontSizeSlider).toHaveValue('16');
    expect(lineHeightSlider).toHaveValue('1.7'); // 変更されたまま
  });
});
```

### 3.3 リアルタイムプレビューテスト
```typescript
describe('SettingsPanel - リアルタイムプレビュー', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('設定変更がCSS変数に即座に反映される', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    
    await user.type(fontSizeSlider, '{arrowright}{arrowright}');
    
    // CSS変数が更新されることを確認
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--document-font-size')).toBe('18px');
  });

  it('複数設定の同時変更が正常に動作する', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    const lineHeightSlider = screen.getByRole('slider', { name: /行間/i });
    const marginSlider = screen.getByRole('slider', { name: /左右マージン/i });
    
    await user.type(fontSizeSlider, '{arrowright}{arrowright}');
    await user.type(lineHeightSlider, '{arrowright}');
    await user.type(marginSlider, '{arrowright}{arrowright}{arrowright}');
    
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--document-font-size')).toBe('18px');
    expect(root.style.getPropertyValue('--document-line-height')).toBe('1.7');
    expect(root.style.getPropertyValue('--document-horizontal-margin')).toBe('35px');
  });
});
```

## 4. 統合テスト（E2E風）

### 4.1 完全なユーザーフロー
```typescript
describe('設定パネル - 統合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('設定変更からlocalStorage保存まで完全フロー', async () => {
    const user = userEvent.setup();
    
    // Layout with Sidebar and SettingsPanel
    render(
      <Layout>
        <div>テスト文書コンテンツ</div>
      </Layout>
    );
    
    // 右サイドバーを開く
    const rightToggle = screen.getByRole('button', { name: /open right sidebar/i });
    await user.click(rightToggle);
    
    // 設定パネルが表示される
    expect(screen.getByText('表示設定')).toBeInTheDocument();
    
    // 文字サイズを変更
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    await user.type(fontSizeSlider, '{arrowright}{arrowright}{arrowright}');
    
    // CSS変数が即座に更新される
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--document-font-size')).toBe('19px');
    
    // デバウンス後にlocalStorageに保存される
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(localStorage.getItem('aozora-settings-fontSize')).toBe('19');
  });

  it('ページリロード後の設定復元', () => {
    // 事前にlocalStorageに設定を保存
    localStorage.setItem('aozora-settings-fontSize', '24');
    localStorage.setItem('aozora-settings-lineHeight', '2.0');
    localStorage.setItem('aozora-settings-horizontalMargin', '40');
    
    render(
      <Layout>
        <div>テスト文書コンテンツ</div>
      </Layout>
    );
    
    // CSS変数が復元されることを確認
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--document-font-size')).toBe('24px');
    expect(root.style.getPropertyValue('--document-line-height')).toBe('2');
    expect(root.style.getPropertyValue('--document-horizontal-margin')).toBe('40px');
  });
});
```

### 4.2 エラーハンドリング統合テスト
```typescript
describe('設定パネル - エラーハンドリング', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('localStorage読み込みエラー時の挙動', () => {
    // 不正なデータを設定
    localStorage.setItem('aozora-settings-fontSize', '{"invalid": "json"}');
    localStorage.setItem('aozora-settings-lineHeight', 'NaN');
    localStorage.setItem('aozora-settings-horizontalMargin', '999999');
    
    expect(() => {
      render(<SettingsPanel />);
    }).not.toThrow();
    
    // デフォルト値またはクランプされた値が使用される
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    expect(fontSizeSlider).toHaveValue('16'); // デフォルト値
  });

  it('localStorage書き込みエラー時の挙動', async () => {
    const user = userEvent.setup();
    
    // localStorage容量を満杯にする
    const maxStorageData = 'x'.repeat(5 * 1024 * 1024); // 5MB
    try {
      localStorage.setItem('dummy', maxStorageData);
    } catch {}
    
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    
    // エラーが発生してもアプリケーションが継続動作する
    expect(async () => {
      await user.type(fontSizeSlider, '{arrowright}');
    }).not.toThrow();
    
    // 設定値自体は更新される
    expect(fontSizeSlider).toHaveValue('17');
  });
});
```

## 5. パフォーマンステスト

### 5.1 レスポンス時間テスト
```typescript
describe('設定パネル - パフォーマンス', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('設定変更が100ms以内に反映される', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    
    const startTime = performance.now();
    
    await user.type(fontSizeSlider, '{arrowright}');
    
    // CSS変数が更新されるまでの時間を測定
    const root = document.documentElement;
    const updatedValue = root.style.getPropertyValue('--document-font-size');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(updatedValue).toBe('17px');
    expect(duration).toBeLessThan(100); // 100ms以内
  });

  it('大量の設定変更でもパフォーマンスが維持される', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const sliders = screen.getAllByRole('slider');
    
    const startTime = performance.now();
    
    // 全スライダーを連続で操作
    for (const slider of sliders) {
      await user.type(slider, '{arrowright}');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500); // 500ms以内で完了
  });
});
```

## 6. モバイル対応テスト

### 6.1 タッチ操作テスト
```typescript
describe('設定パネル - モバイル対応', () => {
  beforeEach(() => {
    // モバイルビューポートをシミュレート
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  it('タッチ操作でスライダーが動作する', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    
    const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i });
    
    // タッチ操作をシミュレート
    await user.pointer([
      { target: fontSizeSlider, pointerName: 'touch', coords: { clientX: 100, clientY: 100 } },
      { pointerName: 'touch', coords: { clientX: 120, clientY: 100 } }
    ]);
    
    expect(fontSizeSlider).not.toHaveValue('16'); // 値が変更される
  });

  it('モバイルでスクロール対応', () => {
    render(<SettingsPanel />);
    
    const settingsPanel = screen.getByRole('region', { name: /設定|settings/i });
    
    // スクロール可能な要素として設定される
    expect(settingsPanel).toHaveStyle('overflow-y: auto');
  });
});
```

## 7. テスト実行環境

### 単体テスト
- **フレームワーク**: Vitest + React Testing Library
- **モック**: localStorage, CSS変数操作
- **カバレッジ**: 90%以上

### 統合テスト
- **環境**: jsdom
- **レンダリング**: Layout + Sidebar + SettingsPanel
- **永続化**: 実際のlocalStorage使用

### E2Eテスト（将来実装）
- **フレームワーク**: Playwright
- **ブラウザ**: Chrome, Firefox, Safari
- **デバイス**: Desktop, Mobile

## 期待される結果

### 成功基準
- 全テストが通過 (100%)
- カバレッジ 90% 以上
- パフォーマンステストで要件を満たす
- アクセシビリティテストで要件を満たす

### 失敗時の対応
- 失敗したテストの詳細ログ出力
- デバッグ用のスナップショット取得
- 段階的な修正とテスト再実行