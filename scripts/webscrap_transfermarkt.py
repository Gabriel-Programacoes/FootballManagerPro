# update_with_scraper.py
import sqlite3
import requests
from bs4 import BeautifulSoup
import time
import pandas as pd
from urllib.parse import quote_plus
import random

print("Iniciando o Web Scraper para o Transfermarkt (Versão Furtiva e Resiliente)...")

# --- CONFIGURAÇÕES ---
# Lista de "disfarces" (User-Agents) para o nosso scraper. Ele irá alternar entre eles.
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

try:
    conn = sqlite3.connect('../master_data.db')
    cursor = conn.cursor()
    print("Conexão com master_data.db bem-sucedida.")

    choice = input("Você deseja marcar todos os jogadores para uma nova busca completa? (s/n): ").lower()
    if choice == 's':
        print("Marcando registros para atualização...")
        cursor.execute("UPDATE players SET value = 0, jerseyNumber = NULL")
        conn.commit()
        print(f"{cursor.rowcount} registros foram marcados.")

    players_df = pd.read_sql_query("SELECT id, name FROM players WHERE value = 0 OR value IS NULL", conn)
    total_players = len(players_df)

    if total_players == 0:
        print("Nenhum jogador para atualizar.")
        exit()

    print(f"Encontrados {total_players} jogadores para buscar.")

    updates_to_execute = []

    session = requests.Session()

    for index, player in players_df.iterrows():
        player_id_local = player['id']
        player_name = player['name']

        print(f"({index + 1}/{total_players}) Processando: {player_name}...")

        try:
            # A cada requisição, usamos um "disfarce" diferente
            session.headers.update({'User-Agent': get_random_user_agent()})

            # ETAPA 1: BUSCAR O JOGADOR
            search_query = quote_plus(player_name)
            search_url = f"https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query={search_query}"

            search_response = session.get(search_url, timeout=20)
            search_response.raise_for_status()

            search_soup = BeautifulSoup(search_response.text, 'html.parser')

            result_table = search_soup.find('div', class_='responsive-table')
            first_player_link_tag = result_table.find('td', class_='hauptlink').find('a') if result_table and result_table.find('td', class_='hauptlink') else None

            if not (first_player_link_tag and 'href' in first_player_link_tag.attrs):
                print(f"  -> Jogador não encontrado na busca. Pulando.")
                time.sleep(random.uniform(2.0, 4.0)) # Pausa mesmo em caso de falha
                continue

            profile_url_suffix = first_player_link_tag['href']
            profile_url = f"https://www.transfermarkt.com{profile_url_suffix}"

            # ETAPA 2: EXTRAIR DADOS DO PERFIL com lógica de Retry melhorada
            profile_response = None
            for attempt in range(4): # Tentar até 4 vezes
                try:
                    profile_response = session.get(profile_url, timeout=20)
                    if profile_response.status_code == 200:
                        break # Sucesso
                    if profile_response.status_code == 503:
                        wait_time = 30 * (attempt + 1)
                        print(f"  -> Recebido erro 503. O servidor está ocupado. Aguardando {wait_time} segundos...")
                        time.sleep(wait_time)
                    else:
                        profile_response.raise_for_status()
                except requests.exceptions.RequestException as e:
                    if attempt < 3:
                        print(f"  -> Erro de conexão ({e}). Tentando novamente em 15 segundos...")
                        time.sleep(15)
                    else:
                        raise # Desiste após a última tentativa

            if not profile_response or profile_response.status_code != 200:
                print("  -> Não foi possível aceder à página do perfil após várias tentativas. Pulando.")
                continue

            profile_soup = BeautifulSoup(profile_response.text, 'html.parser')

            market_value_tag = profile_soup.find('a', class_='data-header__market-value-wrapper')
            real_value = None
            if market_value_tag:
                full_text = market_value_tag.text.strip()
                value_text = full_text.split(' ')[0]
                value_text = value_text.replace('€', '').strip().lower()
                if 'm' in value_text:
                    real_value = float(value_text.replace('m', '')) * 1_000_000
                elif 'k' in value_text:
                    real_value = float(value_text.replace('k', '')) * 1_000

            jersey_tag = profile_soup.find('span', class_='data-header__shirt-number')
            real_jersey = None
            if jersey_tag:
                jersey_text = jersey_tag.text.strip().replace('#', '')
                if jersey_text.isdigit():
                    real_jersey = int(jersey_text)

            final_value = int(real_value) if real_value else 1000

            print(f"  -> SUCESSO! Valor: €{final_value:,} | Camisa: {real_jersey}")
            updates_to_execute.append((final_value, real_jersey, player_id_local))

        except Exception as e:
            print(f"  -> Erro inesperado ao processar {player_name}: {e}")

        # Pausa aleatória e mais longa para ser mais "humano"
        time.sleep(random.uniform(2.5, 5.0))

    if updates_to_execute:
        print(f"\nAtualizando {len(updates_to_execute)} jogadores no banco de dados...")
        cursor.executemany("UPDATE players SET value = ?, jerseyNumber = ? WHERE id = ?", updates_to_execute)
        conn.commit()
        print(f"Atualização concluída! {cursor.rowcount} registros foram modificados.")

except Exception as e:
    print(f"\nOcorreu um erro geral no processo: {e}")
finally:
    if conn:
        conn.close()