# GitHubリポジトリ登録手順

## 1. Gitユーザー情報の設定

まず、Gitのユーザー名とメールアドレスを設定してください。

### グローバル設定（すべてのリポジトリに適用）
```powershell
git config --global user.name "あなたの名前"
git config --global user.email "your-email@example.com"
```

### このリポジトリのみに設定
```powershell
git config user.name "あなたの名前"
git config user.email "your-email@example.com"
```

**注意**: GitHubにプッシュする場合は、GitHubアカウントに登録されているメールアドレスを使用することを推奨します。

## 2. 初回コミットの作成

ユーザー情報を設定した後、以下のコマンドでコミットを作成します：

```powershell
git commit -m "Initial commit: GAS資材・売上管理システム"
```

## 3. GitHubリポジトリの作成

1. GitHubにログインします（https://github.com）
2. 右上の「+」ボタンをクリックし、「New repository」を選択
3. リポジトリ名を入力（例: `GAS_Material_System`）
4. 説明を追加（任意）
5. **Public** または **Private** を選択
6. **「Initialize this repository with a README」のチェックを外す**（既にREADME.mdがあるため）
7. 「Create repository」をクリック

## 4. ローカルリポジトリをGitHubに接続

GitHubでリポジトリを作成すると、表示されるコマンドを実行します。通常は以下のようになります：

```powershell
# リモートリポジトリを追加
git remote add origin https://github.com/あなたのユーザー名/GAS_Material_System.git

# メインブランチの名前を確認（master または main）
git branch

# ブランチ名が main の場合は、master を main にリネーム
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

または、ブランチが `master` の場合は：

```powershell
git remote add origin https://github.com/あなたのユーザー名/GAS_Material_System.git
git push -u origin master
```

## 5. 認証

プッシュ時に認証が求められる場合があります：

- **Personal Access Token (PAT) を使用する場合**:
  - GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
  - 新しいトークンを生成し、`repo` スコープを付与
  - パスワードの代わりにトークンを使用

- **Git Credential Manager を使用する場合**:
  - 初回プッシュ時にブラウザで認証画面が開きます

## トラブルシューティング

### リモートリポジトリが既に存在する場合
```powershell
git remote -v
```

既に設定されている場合は、削除して再設定：
```powershell
git remote remove origin
git remote add origin https://github.com/あなたのユーザー名/GAS_Material_System.git
```

### プッシュが拒否される場合
GitHubでリポジトリを作成する際にREADMEを追加してしまった場合：
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## 次のステップ

リポジトリが正常にプッシュされたら、以下のことができます：

- GitHub上でコードを確認
- 他の開発者と共有
- IssuesやPull Requestsを使用した開発管理
- GitHub Actionsでの自動化（将来の拡張）

