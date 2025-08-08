import sqlite3
import pandas as pd
from fuzzywuzzy import process
from tqdm import tqdm
import unicodedata
import re

# --- CONFIGURAÇÃO ---
CSV_FILENAME = 'players_data.csv'
SIMILARITY_THRESHOLD = 90  # Nível de confiança para a correspondência (90 é um bom ponto de partida)

# Mapeamento das colunas do CSV para as colunas da nossa base de dados
COLUMN_MAP = {
    'name': 'name',
    'overall_rating': 'overall',
    'potential': 'potential',  # Nova coluna
    'value': 'value',
    'wage': 'wage',
    'club_kit_number': 'jerseyNumber',
    'weak_foot': 'weak_foot',  # Nova coluna
    'skill_moves': 'skill_moves',  # Nova coluna
    'work_rate': 'work_rate',  # Nova coluna
    'play_styles': 'player_traits',  # Nova coluna
    'crossing': 'passing_crossing',
    'finishing': 'shooting_finishing',
    'short_passing': 'passing_shortPassing',
    'dribbling': 'dribbling_dribbling',
    'fk_accuracy': 'passing_freeKickAccuracy',
    'long_passing': 'passing_longPassing',
    'acceleration': 'pace_acceleration',
    'sprint_speed': 'pace_sprintSpeed',
    'stamina': 'physical_stamina',
    'strength': 'physical_strength',
    'aggression': 'physical_aggression',
    'penalties': 'shooting_penalties',
    'defensive_awareness': 'defensive_awareness',
    'standing_tackle': 'defending_standingTackle',
    'sliding_tackle': 'defending_slidingTackle',
    'gk_positioning': 'goalkeeping_gkPositioning',
    'gk_reflexes': 'goalkeeping_gkReflexes',
}


def normalize_name(name):
    if not isinstance(name, str): return ""
    name = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
    return name.lower().strip()


def add_columns_if_not_exist(cursor):
    """Adiciona as novas colunas à tabela de jogadores se elas não existirem."""
    new_columns = {
        'potential': 'INTEGER', 'weak_foot': 'INTEGER',
        'skill_moves': 'INTEGER', 'work_rate': 'TEXT', 'player_traits': 'TEXT'
    }
    cursor.execute("PRAGMA table_info(players)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    for col_name, col_type in new_columns.items():
        if col_name not in existing_columns:
            print(f"Adicionando coluna '{col_name}'...")
            cursor.execute(f"ALTER TABLE players ADD COLUMN {col_name} {col_type}")
    print("Verificação de esquema concluída.")


print(f"Iniciando a atualização a partir de '{CSV_FILENAME}'...")

try:
    # 1. Conectar ao DB e preparar a estrutura
    conn = sqlite3.connect('master_data.db')
    cursor = conn.cursor()
    add_columns_if_not_exist(cursor)
    conn.commit()

    # 2. Carregar dados do CSV (apenas as colunas necessárias)
    print("Lendo o arquivo CSV...")
    csv_df = pd.read_csv(CSV_FILENAME, usecols=list(COLUMN_MAP.keys())).dropna(subset=['name'])
    csv_df['normalized_name'] = csv_df['name'].apply(normalize_name)
    csv_name_choices = csv_df['normalized_name'].tolist()

    # --- OTIMIZAÇÃO PRINCIPAL AQUI ---
    # 3. Carregar APENAS os jogadores que ainda precisam de atualização
    db_df = pd.read_sql_query("SELECT id, name FROM players WHERE value = 0 OR value IS NULL", conn)

    total_remaining = len(db_df)
    if total_remaining == 0:
        print("\nParabéns! Todos os jogadores no banco de dados já foram atualizados.")
        exit()

    print(
        f"Encontrados {len(csv_df)} jogadores no CSV e {total_remaining} jogadores restantes no banco para atualizar.")
    db_df['normalized_name'] = db_df['name'].apply(normalize_name)

    # 4. Processo de Fuzzy Matching (agora sobre a lista menor)
    updates_to_execute = []
    print("\nIniciando o processo de correspondência para os jogadores restantes...")

    for index, db_row in tqdm(db_df.iterrows(), total=db_df.shape[0], desc="Analisando jogadores"):
        db_player_id = db_row['id']
        db_normalized_name = db_row['normalized_name']

        best_match, score = process.extractOne(db_normalized_name, csv_name_choices)

        if score >= SIMILARITY_THRESHOLD:
            csv_row = csv_df[csv_df['normalized_name'] == best_match].iloc[0]

            update_values = {}
            for csv_col, db_col in COLUMN_MAP.items():
                value = csv_row.get(csv_col)
                if pd.isna(value):
                    update_values[db_col] = None if db_col in ['work_rate', 'player_traits'] else 0
                else:
                    update_values[db_col] = value

            ordered_values = [update_values[db_col] for csv_col, db_col in COLUMN_MAP.items()]
            ordered_values.append(db_player_id)
            updates_to_execute.append(tuple(ordered_values))

    total_matches = len(updates_to_execute)
    print(f"\nCorrespondência encontrada para {total_matches} jogadores.")

    # 5. Executar a atualização no banco de dados
    if total_matches > 0:
        print(f"Atualizando {total_matches} jogadores no banco de dados...")
        set_clause = ", ".join([f"{db_col} = ?" for db_col in COLUMN_MAP.values()])
        # Precisamos remover o 'id' da lista para o SET, pois ele está no WHERE
        db_columns_for_set = list(COLUMN_MAP.values())
        if 'id' in db_columns_for_set: db_columns_for_set.remove('id')
        set_clause = ", ".join([f"{col} = ?" for col in db_columns_for_set])

        # Recriar a lista de valores na ordem correta para o SET
        final_updates = []
        for update_tuple in updates_to_execute:
            # O último valor é o id, então pegamos todos menos o último para o SET
            final_updates.append(update_tuple[:-1] + (update_tuple[-1],))

        sql_command = f"UPDATE players SET {set_clause} WHERE id = ?"

        # O número de '?' no SET deve corresponder aos valores
        # A lista de valores para o executemany deve ter N valores + 1 (para o id do WHERE)
        values_for_update = []
        for row in updates_to_execute:
            temp_row = list(row)
            player_id = temp_row.pop(-1)  # Remove o id do final
            values_for_update.append(tuple(temp_row + [player_id]))

        cursor.executemany(sql_command, values_for_update)
        conn.commit()
        print(f"\nAtualização concluída com sucesso! {cursor.rowcount} registros foram modificados.")
    else:
        print("\nNenhuma nova correspondência encontrada para atualizar.")

except FileNotFoundError:
    print(f"ERRO: O arquivo '{CSV_FILENAME}' não foi encontrado.")
except Exception as e:
    print(f"\nOcorreu um erro durante o processo: {e}")
    conn.rollback()
finally:
    if 'conn' in locals() and conn:
        conn.close()