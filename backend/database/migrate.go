package database

import (
	"database/sql"
	"fmt"
	"io/fs"
	"sort"
	"strings"
)

// RunMigrations は fsys 内の *_up.sql ファイルをアルファベット順に実行する。
// _down.sql ファイルは除外する。
func RunMigrations(db *sql.DB, fsys fs.FS) error {
	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if !strings.HasSuffix(name, ".sql") {
			continue
		}
		if strings.HasSuffix(name, "_down.sql") {
			continue
		}
		files = append(files, name)
	}

	sort.Strings(files)

	for _, name := range files {
		content, err := fs.ReadFile(fsys, name)
		if err != nil {
			return fmt.Errorf("read migration file %s: %w", name, err)
		}

		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("exec migration %s: %w", name, err)
		}
	}

	return nil
}
