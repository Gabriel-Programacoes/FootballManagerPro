# add_country_column.py
import sqlite3

print("Iniciando migração de esquema: Adicionando a coluna 'countryName' à tabela 'clubs'.")

try:
    # Conecta ao banco de dados existente
    conn = sqlite3.connect('../master_data.db')
    cursor = conn.cursor()

    # O comando ALTER TABLE adiciona a nova coluna à tabela existente.
    # IF NOT EXISTS não é padrão no ALTER TABLE do SQLite, então vamos verificar primeiro.

    # Pega informações sobre as colunas da tabela 'clubs'
    cursor.execute("PRAGMA table_info(clubs)")
    columns = [row[1] for row in cursor.fetchall()]

    if 'countryName' not in columns:
        print("Coluna 'countryName' não encontrada. Adicionando agora...")
        cursor.execute("ALTER TABLE clubs ADD COLUMN countryName TEXT")
        conn.commit()
        print("Coluna 'countryName' adicionada com sucesso!")
    else:
        print("Coluna 'countryName' já existe. Nenhuma alteração necessária.")

except sqlite3.Error as e:
    print(f"Ocorreu um erro no banco de dados: {e}")
    conn.rollback()  # Desfaz a alteração em caso de erro

finally:
    if conn:
        conn.close()
        print("Conexão com o banco de dados fechada.")