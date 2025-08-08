# update_with_fuzzy_matching.py
import sqlite3
import pandas as pd
from fuzzywuzzy import process
from tqdm import tqdm

# --- CONFIGURAÇÃO ---
CSV_FILENAME = 'players_data.csv'
CSV_PLAYER_NAME_COLUMN = 'name'
CSV_MARKET_VALUE_COLUMN = 'value'
SIMILARITY_THRESHOLD = 90

print(f"Iniciando a atualização com Fuzzy Matching (Otimizado)...")

try:
    # 1. Carregar os dados do CSV (apenas uma vez)
    print("Lendo o arquivo CSV (pode demorar um pouco)...")
    csv_df = pd.read_csv(CSV_FILENAME, usecols=[CSV_PLAYER_NAME_COLUMN, CSV_MARKET_VALUE_COLUMN]).dropna()

    csv_name_choices = csv_df[CSV_PLAYER_NAME_COLUMN].tolist()
    csv_value_map = pd.Series(csv_df[CSV_MARKET_VALUE_COLUMN].values, index=csv_df[CSV_PLAYER_NAME_COLUMN]).to_dict()
    print(f"Encontrados {len(csv_df)} jogadores de referência no CSV.")

    # 2. Conectar ao banco de dados
    conn = sqlite3.connect('master_data.db')
    cursor = conn.cursor()
    print("Conexão com master_data.db bem-sucedida.")

    # --- OTIMIZAÇÃO PRINCIPAL AQUI ---
    # 3. Carregar APENAS os jogadores que ainda não foram atualizados
    # Ele procura por jogadores cujo valor seja 0 ou nulo.
    db_df_remaining = pd.read_sql_query("SELECT id, name FROM players WHERE value = 0 OR value IS NULL", conn)

    total_remaining = len(db_df_remaining)
    if total_remaining == 0:
        print("\nParabéns! Todos os jogadores no banco de dados já foram atualizados.")
        exit()

    print(f"Encontrados {total_remaining} jogadores restantes para serem atualizados.")

    # 4. Processo de Fuzzy Matching (agora sobre a lista menor)
    updates_to_execute = []

    print("\nIniciando o processo de correspondência para os jogadores restantes...")

    for index, row in tqdm(db_df_remaining.iterrows(), total=total_remaining, desc="Analisando jogadores"):
        db_player_id = row['id']
        db_player_name = row['name']

        try:
            best_match, score = process.extractOne(db_player_name, csv_name_choices)

            if score >= SIMILARITY_THRESHOLD:
                market_value = csv_value_map[best_match]
                updates_to_execute.append((market_value, db_player_id))
        except Exception:
            continue

    total_matches = len(updates_to_execute)
    if total_matches == 0:
        print("\nNenhuma nova correspondência encontrada nesta execução.")
        exit()

    print(f"\nCorrespondência por similaridade concluída. {total_matches} novos jogadores encontrados.")

    # 5. Executar a atualização no banco de dados
    print(f"Atualizando {total_matches} jogadores no banco de dados...")

    cursor.executemany("UPDATE players SET value = ? WHERE id = ?", updates_to_execute)
    conn.commit()

    print(f"\nAtualização concluída com sucesso! {cursor.rowcount} registros foram modificados.")

except FileNotFoundError:
    print(f"ERRO: O arquivo '{CSV_FILENAME}' não foi encontrado.")
except Exception as e:
    print(f"\nOcorreu um erro durante o processo: {e}")
    conn.rollback()
finally:
    if 'conn' in locals() and conn:
        conn.close()