# 開発ルール

## 役割分担

| 担当 | 領域 |
|------|------|
| フロントエンド専任 | React/TS UI実装・コンポーネント・スタイリング・PWA設定 |
| バックエンド専任 | Go/Gin API実装・DB設計・AI API連携・インフラ（AWS移行） |
| 横断 | フロント・バック双方のサポート・結合・デバッグ |

---

## Git ルール

### ブランチ戦略

- `main` ブランチは常にデプロイ可能な状態を維持する
- `main` から Issue ごとに `feat/<Issue番号>` ブランチを切る

### コミットメッセージ

```
[タグ] #<Issue番号> 実装内容

例:
[add] #1 機能A追加
[fix] #12 バグBの修正
```

複数行の場合：
- 1行目：変更内容の要約
- 2行目：空行
- 3行目以降：変更した理由・詳細

---

## タスク管理

**GitHub Projects で一本化。**

- 自分が担当している Issue には必ず自分をアサインする（重複作業の防止）
- 参考：[GitHub Projects ドキュメント](https://docs.github.com/ja/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)

---

## PR・コードレビュー

- **マージ：** 基本は自分でマージ
- **レビュー観点：** 可読性より仕様の問題を優先。明らかに仕様と違う・壊れている場合は指摘する

---

## テスト

TDDで進めることを基本とする。負担が大きければ無理に徹底しない。

---

## コーディング規約

『リーダブル・コード』、DRY原則、YAGNI原則、SOLID原則を意識する。  
完璧にこなすことより、ある程度意識することを目標にする。

### フロントエンド

**命名規則**

| 対象 | 規則 |
|------|------|
| React コンポーネント・ファイル名・`type` 型名 | `UpperCamelCase` |
| 変数・関数名・`.ts` ファイル名 | `camelCase` |
| 定数 | `CONSTANT_CASE` |

**リンター・フォーマッター：** ESLint + Prettier

### バックエンド

[Effective Go](https://go.dev/doc/effective_go) に準拠。

**命名規則**

| 対象 | 規則 |
|------|------|
| ファイル名 | `lower_snake_case` |
| 公開関数・定数 | `UpperCamelCase` |
| 非公開関数・変数 | `lowerCamelCase` |

**リンター・フォーマッター：** golangci-lint
