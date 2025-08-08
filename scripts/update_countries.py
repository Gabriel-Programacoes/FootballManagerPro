# update_countries.py
import sqlite3
import pandas as pd

print("Iniciando a atualização dos países (baseado em ligas) no banco de dados...")

# --- MAPEAMENTO DE LIGAS PARA PAÍSES ---
# Esta é a nossa nova "fonte da verdade".
LEAGUE_TO_COUNTRY_MAP = {
    # Inglaterra
    'Premier League': 'Inglaterra', 'EFL Championship': 'Inglaterra',
    'EFL League One': 'Inglaterra', 'EFL League Two': 'Inglaterra',
    # Espanha
    'LALIGA EA SPORTS': 'Espanha', 'LALIGA HYPERMOTION': 'Espanha',
    # Alemanha
    'Bundesliga': 'Alemanha', 'Bundesliga 2': 'Alemanha', '3. Liga': 'Alemanha',
    # Itália
    'Serie A Enilive': 'Itália', 'Serie BKT': 'Itália',
    # França
    "Ligue 1 McDonald's": 'França', 'Ligue 2 BKT': 'França',
    # Portugal
    'Liga Portugal': 'Portugal',
    # Holanda
    'Eredivisie': 'Holanda',
    # Outros
    'Scottish Prem': 'Escócia',
    'SSE Airtricity PD': 'Irlanda',
    'Trendyol Süper Lig': 'Turquia',
    'CSSL': 'Suíça',
    'Raiffeisen Super League': 'Suíça',  # Nome antigo
    '1A Pro League': 'Bélgica',
    '3F Superliga': 'Dinamarca',
    'Eliteserien': 'Noruega',
    'Allsvenskan': 'Suécia',
    'PKO Bank Polski Ekstraklasa': 'Polônia',
    'MLS': 'EUA',
    'Campeonato Brasileiro Série A': 'Brasil',
    'Primera División': 'Argentina',
    'Liga BetPlay DIMAYOR': 'Colômbia',
    'cinch Premiership': 'Escócia',
    'CSL': 'China',
    'K League 1': 'Coréia do Sul',
    'ROSHN Saudi League': 'Arábia Saudita',
    'SUPERLIGA': 'Romênia',
    'Ö. Bundesliga': 'Áustria',
    'PKO BP Ekstraklasa': 'Polônia',
    'A-League': 'Austrália',
    'ISL': 'Índia'
}

try:
    conn = sqlite3.connect('../master_data.db')
    cursor = conn.cursor()
    print("Conexão com master_data.db bem-sucedida.")

    # Carrega todos os clubes do banco
    clubs_df = pd.read_sql_query("SELECT id, name, leagueName FROM clubs", conn)
    print(f"Dados de {len(clubs_df)} clubes lidos do banco.")

    # --- NOVA LÓGICA ---
    # 1. Atribui um país a cada clube com base no mapeamento de ligas
    clubs_df['countryName'] = clubs_df['leagueName'].map(LEAGUE_TO_COUNTRY_MAP).fillna('Desconhecido')

    # 2. Conta quantos clubes cada país tem
    country_club_counts = clubs_df['countryName'].value_counts()

    # 3. Identifica os países que irão para o "Resto do Mundo"
    MIN_CLUBS_FOR_COUNTRY = 9
    countries_to_merge = country_club_counts[country_club_counts < MIN_CLUBS_FOR_COUNTRY].index

    # Adiciona 'Desconhecido' à lista para garantir que também seja mesclado
    final_merge_list = list(countries_to_merge)
    if 'Desconhecido' not in final_merge_list:
        final_merge_list.append('Desconhecido')

    # 4. Atualiza o nome do país para 'Resto do mundo' para os clubes desses países
    clubs_df.loc[clubs_df['countryName'].isin(final_merge_list), 'countryName'] = 'Resto do mundo'

    print(f"Lógica baseada em ligas aplicada. Países a serem movidos: {list(countries_to_merge)}")

    # 5. Prepara e executa os comandos de ATUALIZAÇÃO
    updates_to_execute = [(row['countryName'], row['id']) for index, row in clubs_df.iterrows()]

    print(f"Preparando para atualizar {len(updates_to_execute)} clubes no banco de dados...")
    cursor.executemany("UPDATE clubs SET countryName = ? WHERE id = ?", updates_to_execute)

    conn.commit()
    print(f"\nAtualização concluída com sucesso! {cursor.rowcount} registros de clubes foram modificados.")

except Exception as e:
    print(f"\nOcorreu um erro durante o processo: {e}")
    conn.rollback()
finally:
    if conn:
        conn.close()