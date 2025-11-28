# GitHubリポジトリ セットアップガイド

このドキュメントでは、このプロジェクト（GAS資材・売上管理システム）をGitHubで管理するための手順を説明します。

## リポジトリ情報

- **リポジトリURL**: https://github.com/GithubOgY/GAS_Material_System.git
- **デフォルトブランチ**: `master`

## 1. 環境設定

Gitのユーザー名とメールアドレスが設定されているか確認してください。

```powershell
# 設定確認
git config --list

# 設定コマンド（未設定の場合）
git config user.name "あなたの名前"
git config user.email "your-email@example.com"
```

## 2. リポジトリのセットアップ（初回のみ）

### 既存のリポジトリをクローンする場合

このプロジェクトを新しく環境に持ってくる場合は、クローンが最も簡単です。

```powershell
git clone https://github.com/GithubOgY/GAS_Material_System.git
cd GAS_Material_System
```

### ローカルプロジェクトをGitHubに接続する場合

既にローカルにファイルがあり、それをGitHubにアップロードする場合の手順です。

1. **Gitの初期化**（まだの場合）
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **リモートリポジトリの追加**
   ```powershell
   git remote add origin https://github.com/GithubOgY/GAS_Material_System.git
   ```

3. **リモートへのプッシュ**
   
   現在のデフォルトブランチは `master` です。
   ```powershell
   git push -u origin master
   ```

   ※ 以前の手順にあった `main` へのリネームは不要です。

## 3. 開発フロー

### 変更の記録と反映

```powershell
# 1. 変更状態の確認
git status

# 2. 変更をステージング（全ての変更を追加）
git add .

# 3. コミット（変更内容の保存）
git commit -m "変更内容の説明"

# 4. GitHubへプッシュ
git push origin master
```

### 最新コードの取得

```powershell
git pull origin master
```

## 4. トラブルシューティング

### 認証エラーが出る場合
GitHubへのプッシュ時にパスワードを求められた場合、**Personal Access Token (PAT)** を使用するか、**Git Credential Manager** を利用してください。GitHubのログインパスワードは使用できません。

### 競合（Conflict）が発生した場合
`git pull` 時に競合が発生した場合は、競合箇所を手動で修正し、再度コミットしてください。

## 5. Cursor / MCPツールの活用

Cursorエディタを使用している場合、GitHub MCPサーバー（Model Context Protocol）を利用してリポジトリ操作を効率化できます。

- **リポジトリ検索**: `mcp_github_search_repositories`
- **ファイル操作**: `mcp_github_get_file_contents`, `mcp_github_push_files`
- **プルリクエスト作成**: `mcp_github_create_pull_request`

これにより、ターミナル操作を行わずにエディタとの対話だけでGit操作を完結させることも可能です。
