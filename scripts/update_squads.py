# update_countries.py
import sqlite3
import pandas as pd  # Usaremos pandas para facilitar a manipulação

print("Iniciando a atualização dos países no banco de dados...")

# 1. Conecta ao banco de dados existente
try:
    conn = sqlite3.connect('../master_data.db')
    cursor = conn.cursor()
    print("Conexão com master_data.db bem-sucedida.")
except sqlite3.Error as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
    exit()

try:
    # 2. Carrega os dados necessários do banco para a memória
    # Usar o pandas é muito eficiente para ler dados de SQL
    clubs_df = pd.read_sql_query("SELECT id, name FROM clubs", conn)
    players_df = pd.read_sql_query("SELECT club_id, profile_nation FROM players", conn)
    print(f"Dados de {len(clubs_df)} clubes e {len(players_df)} jogadores lidos do banco.")

    # 3. Aplica a lógica do "Resto do Mundo" em memória

    # Agrupa jogadores por clube e nação para encontrar a nação dominante
    nation_counts = players_df.groupby(['club_id', 'profile_nation']).size().reset_index(name='counts')
    dominant_nations_idx = nation_counts.groupby('club_id')['counts'].idxmax()
    dominant_nations = nation_counts.loc[dominant_nations_idx][['club_id', 'profile_nation']]
    dominant_nations.set_index('club_id', inplace=True)

    # Mapeia a nação dominante para cada clube
    clubs_df['countryName'] = clubs_df['id'].map(dominant_nations['profile_nation']).fillna('Resto do mundo')

    # Conta quantos clubes cada país tem
    country_club_counts = clubs_df['countryName'].value_counts()

    # Identifica os países que irão para o "Resto do Mundo"
    MIN_CLUBS_FOR_COUNTRY = 9
    countries_to_merge = country_club_counts[country_club_counts < MIN_CLUBS_FOR_COUNTRY].index

    # Atualiza o nome do país para 'Resto do mundo' para os clubes desses países
    clubs_df.loc[clubs_df['countryName'].isin(countries_to_merge), 'countryName'] = 'Resto do mundo'

    print(f"Lógica aplicada. Países a serem movidos: {list(countries_to_merge)}")

    # 4. Prepara e executa os comandos de ATUALIZAÇÃO (UPDATE)

    updates_to_execute = []
    for index, row in clubs_df.iterrows():
        # Prepara uma tupla com (novo_país, id_do_clube)
        updates_to_execute.append((row['countryName'], row['id']))

    print(f"Preparando para atualizar {len(updates_to_execute)} clubes no banco de dados...")

    # O comando SQL agora é UPDATE, não INSERT ou CREATE
    cursor.executemany("UPDATE clubs SET countryName = ? WHERE id = ?", updates_to_execute)

    # Salva as alterações
    conn.commit()

    print(f"\nAtualização concluída com sucesso! {cursor.rowcount} registros de clubes foram modificados.")

except Exception as e:
    print(f"\nOcorreu um erro durante o processo: {e}")
    print("Nenhuma alteração foi salva (rollback).")
    conn.rollback()

finally:
    # Fecha a conexão
    conn.close()