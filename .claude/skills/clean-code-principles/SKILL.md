---
name: clean-code-principles
description: コードの作成、リファクタリング、コードレビューを行う際に使用します。リーダブルコード、DRY、YAGNI、PEP8などのベストプラクティスに基づいて、保守性の高い高品質なコードを書くためのガイドラインを提供します。
---

# Clean Code Principles

## 概要

このスキルは、『リーダブル・コード』、DRY原則、YAGNI原則、PEP8、SOLID原則などのソフトウェアエンジニアリングのベストプラクティスを統合し、高品質で保守性の高いコードを書くためのガイドラインを提供します。

すべてのコード作成およびコードレビュータスクにこれらの原則を適用してください。

## コア原則

### 1. 可読性最優先（『リーダブル・コード』より）

**核心**: コードは書かれる回数よりも読まれる回数の方がはるかに多い。書き手ではなく読み手のために最適化する。

#### 命名規則

**意図を明らかにする名前を使う**: 名前は、それが存在する理由、何をするのか、どう使うのかを説明すべき

```python
# 悪い例
d = 86400  # 1日の秒数

# 良い例
SECONDS_PER_DAY = 86400
```

**意味のある区別をする**: 連番（a1, a2）やノイズワードを避ける

```python
# 悪い例
def get_user_info_data():

# 良い例
def get_user_profile():
```

**発音可能で検索可能な名前を使う**

```python
# 悪い例
genymdhms = datetime.now()

# 良い例
generation_timestamp = datetime.now()
```

#### 関数設計

**小さな関数**: 各関数は一つのことをうまく行うべき

**関数ごとに一つの抽象レベル**: 高レベルの概念と低レベルの詳細を混在させない

**説明的な名前**: 関数名は動詞または動詞句であるべき

```python
# 良い例
def save_user_to_database(user):
def is_valid_email(email):
def calculate_monthly_payment(principal, rate, term):
```

**引数を最小限にする**: 理想はゼロ、許容できるのは1〜2個、3個は正当化が必要

```python
# 悪い例
def create_user(name, email, age, address, phone, role, status):

# 良い例 - データクラスや辞書を使う
def create_user(user_data: UserData):
```

#### コメント

**WHYを説明し、WHATは説明しない**: コードは何をするかを自己説明的であるべき

```python
# 悪い例
# iをインクリメント
i += 1

# 良い例
# ヘッダー行をスキップ
i += 1
```

**自明でないビジネスロジックにコメントする**

```python
# 金融規制で日次複利計算が義務付けられているため、
# 複利計算式を使用
interest = principal * (1 + rate/365) ** (365 * years)
```

**コメントアウトされたコードは削除**: バージョン管理が記憶している

**コメントを最新に保つ**: 古いコメントはコメントがないよりも悪い

### 2. DRY（Don't Repeat Yourself）

**原則**: すべての知識は、システム内で単一、明確、信頼できる表現を持つべき

#### 適用方法

**繰り返されるコードを関数やクラスに抽出**

```python
# 悪い例
user1_full_name = user1.first_name + " " + user1.last_name
user2_full_name = user2.first_name + " " + user2.last_name

# 良い例
def get_full_name(user):
    return f"{user.first_name} {user.last_name}"
```

**繰り返される値には設定ファイルを使う**

**繰り返されるパターンには抽象化を作る**

**ただし**: 過度なDRYは避ける - コードが似ていても目的が異なる場合、重複は許容される場合がある

### 3. YAGNI（You Aren't Gonna Need It）

**原則**: 実際に必要になるまで機能を実装しない

#### 適用方法

**早すぎる抽象化を避ける**: 具体的に始め、パターンが現れたらリファクタリング

**「将来のための」実装をしない**: 「念のため」で機能を追加しない

**使われていないコードを削除**: 呼び出されていなければ削除する

```python
# 悪い例 - 使われない柔軟性を追加
def calculate_price(base_price, discount=None, tax_rate=None, 
                   currency=None, rounding_mode=None):
    # base_priceしか使われていない

# 良い例 - 必要になったらパラメータを追加
def calculate_price(base_price):
    return base_price * 1.1  # 10%の税
```

### 4. SOLID原則（簡単な概要）

- **単一責任の原則**: クラスは変更する理由を一つだけ持つべき
- **開放閉鎖の原則**: 拡張に対して開いており、変更に対して閉じている
- **リスコフの置換原則**: 派生クラスは基底クラスの代わりに使えるべき
- **インターフェース分離の原則**: 多くの特化したインターフェースは一つの汎用インターフェースより良い
- **依存性逆転の原則**: 抽象に依存し、具象に依存しない

### 5. 言語固有の標準

#### Python（PEP 8ベース、行の長さは2000文字まで）

```python
# 命名規則
class UserAccount:  # クラスはCapWords
    pass

def calculate_total():  # 関数はlowercase_with_underscores
    pass

CONSTANT_VALUE = 100  # 定数はUPPERCASE
user_name = "John"  # 変数はlowercase_with_underscores

# インデント: 4スペース（タブ禁止）
# 最大行長: 2000文字
# import文: 標準ライブラリ、サードパーティ、ローカル（空行で区切る）

import os
import sys

import requests
from flask import Flask

from myapp.models import User
```

#### JavaScript/TypeScript

```javascript
// 変数と関数はcamelCase
const userName = "John";
function calculateTotal() {}

// クラスはPascalCase
class UserAccount {}

// 定数はUPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// デフォルトはconst、再代入が必要な場合はlet、varは使わない
```

## コードレビューチェックリスト

コードをレビューまたは書く際に確認すること：

### 構造
- [ ] 関数は小さく焦点が絞られている（理想は20行以下）
- [ ] 各関数は一つのことをする
- [ ] 一貫したインデントとフォーマット
- [ ] 深いネスト構造がない（最大3〜4レベル）

### 命名
- [ ] 変数と関数に明確で説明的な名前
- [ ] 名前は発音可能で検索可能
- [ ] 真偽値の変数・関数にはis_, has_, can_プレフィックス
- [ ] 広く知られていない限り略語を使わない

### ロジック
- [ ] 重複コードがない（DRY違反）
- [ ] 未使用のコードやコメントアウトされたコードがない
- [ ] 早すぎる最適化や過剰設計がない（YAGNI）
- [ ] エッジケースが処理されている
- [ ] エラー処理が存在し意味がある

### 可読性
- [ ] コードが散文のように読める
- [ ] コメントはなぜを説明し、何をは説明しない
- [ ] 複雑なロジックは名前付き中間変数に分解されている
- [ ] マジックナンバーは名前付き定数に置き換えられている

### テスト
- [ ] コードはテスト可能（隠れた依存関係がない）
- [ ] 関数は明確な入力と出力を持つ
- [ ] 副作用が最小化され文書化されている

## 避けるべきアンチパターン

### 1. マジックナンバー
名前付き定数を使う

```python
# 悪い例
if user.age > 18:

# 良い例
LEGAL_ADULT_AGE = 18
if user.age > LEGAL_ADULT_AGE:
```

### 2. 神オブジェクト・神関数
やりすぎるクラスや関数

### 3. 早すぎる最適化
「早すぎる最適化は諸悪の根源」 - Donald Knuth

### 4. ショットガン手術
一つの変更で多くの場所を修正する必要がある（DRY違反）

### 5. コピペプログラミング
抽象化せずにコードを複製

### 6. アローコード
深くネストした条件文

```python
# 悪い例
if condition1:
    if condition2:
        if condition3:
            # 深いネスト

# 良い例 - 早期リターン
if not condition1:
    return
if not condition2:
    return
if not condition3:
    return
# メインロジック
```

## コンテキスト別のベストプラクティス

### 新しいコードを書くとき

1. 最もシンプルなソリューションから始める
2. 動くようにし、次に正しくし、その次に速くする
3. 自己文書化コードを最初に書き、必要な場合のみコメントを追加
4. このコードを読む次の人のことを考える

### リファクタリングするとき

1. リファクタリング前にテストが存在することを確認
2. 小さく段階的なステップでリファクタリング
3. 一度に一つのリファクタリングタイプ（リネーム、次に抽出など）
4. 各変更後にテストを実行

### コードレビューするとき

1. コードは理解しやすいか？
2. 新しいチームメンバーは6ヶ月後にこれを理解できるか？
3. 明らかなバグやエッジケースはあるか？
4. チームのコーディング標準に従っているか？
5. 複雑さは正当化されているか？

## 使用方法

### コード作成時

このスキルが有効な状態で通常通りコーディングタスクを依頼すると、自動的にこれらの原則が適用されます。

```
Pythonでユーザー認証システムを実装してください
```

```
React でダッシュボードコンポーネントを作成してください
```

### コードレビュー時

既存のコードの改善点を確認する際にも使用できます。

```
このコードをレビューして、改善すべき点を教えてください
```

### 特定の原則を強調したい場合

明示的に原則を指定できます。

```
このコードをDRY原則に従ってリファクタリングしてください
```

```
YAGNI原則を意識して、シンプルな実装にしてください
```

## 重要な格言

> 「コンピュータが理解できるコードは愚か者でも書ける。良いプログラマは人間が理解できるコードを書く。」 - Martin Fowler

> 「クリーンなコードは、ルールに従うことで書かれるものではない。何をすべきで何をすべきでないかのリストを学ぶことでソフトウェア職人にはなれない。プロフェッショナリズムと職人技は、規律を駆動する価値観から来る。」 - Robert C. Martin

目標は完璧さではなく、継続的な改善です。これらの原則を、状況とトレードオフを考慮して実用的に適用してください。

## 参考資料

- 『リーダブルコード ―より良いコードを書くためのシンプルで実践的なテクニック』（Dustin Boswell, Trevor Foucher著、角征典訳）
- 『Clean Code アジャイルソフトウェア達人の技』（Robert C. Martin著、花井志生訳）
- PEP 8 -- Style Guide for Python Code: https://peps.python.org/pep-0008/
- PEP 20 -- The Zen of Python: https://peps.python.org/pep-0020/
- Airbnb JavaScript Style Guide: https://github.com/airbnb/javascript
- Google Style Guides: https://google.github.io/styleguide/
