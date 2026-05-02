const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'greencode.db');

class DBWrapper {
  constructor(sqlDb) { this._db = sqlDb; }

  prepare(sql) {
    const db = this._db;
    return {
      run(...params) {
        db.run(sql, params);
        const r = db.exec("SELECT last_insert_rowid() as id");
        const lastId = r.length ? r[0].values[0][0] : 0;
        return { lastInsertRowid: lastId, changes: db.getRowsModified() };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let row = null;
        if (stmt.step()) row = stmt.getAsObject();
        stmt.free();
        return row;
      },
      all(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      }
    };
  }

  exec(sql) { this._db.exec(sql); }

  save() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

async function initDB() {
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  const w = new DBWrapper(db);

  w.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, description TEXT
    );
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, language TEXT NOT NULL,
      code TEXT NOT NULL, category_id INTEGER NOT NULL, complexity_time TEXT NOT NULL,
      complexity_space TEXT, energy_score INTEGER NOT NULL, author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      snippet_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (snippet_id) REFERENCES snippets(id),
      UNIQUE(user_id, snippet_id)
    );
  `);

  const count = w.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (count.c === 0) {
    const cats = [['Tri','Algorithmes de tri'],['Recherche','Algorithmes de recherche'],
      ['Parsing','Analyse de donnees textuelles'],['Calcul','Operations mathematiques'],
      ['Structures de donnees','Listes, arbres, graphes'],['Chaines','Manipulation de chaines']];
    for (const [n,d] of cats) w.prepare('INSERT INTO categories (name,description) VALUES (?,?)').run(n,d);

    const hash = bcrypt.hashSync('admin123', 10);
    w.prepare('INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)').run('admin','admin@greencode.hub',hash,'admin');

    const ins = (t,l,c,ci,ct,cs,es) => w.prepare('INSERT INTO snippets (title,language,code,category_id,complexity_time,complexity_space,energy_score,author_id) VALUES (?,?,?,?,?,?,?,?)').run(t,l,c,ci,ct,cs,es,1);

    ins('Tri fusion (Merge Sort)','Python',
`def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]`, 1,'O(n log n)','O(n)',3);

    ins('Recherche dichotomique','Java',
`public static int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`, 2,'O(log n)','O(1)',5);

    ins('Tri a bulles','C',
`void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int t = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = t;
            }
}`, 1,'O(n2)','O(1)',2);

    ins('Fibonacci memoize','Python',
`def fib(n, memo={}):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]`, 4,'O(n)','O(n)',4);

    ins('Parcours lineaire','JavaScript',
`function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`, 2,'O(n)','O(1)',4);

    w.save();
  }

  setInterval(() => w.save(), 30000);
  return w;
}

module.exports = initDB;
