# update_club_details.py
import sqlite3
import pandas as pd
import json

print("Iniciando a inserção/atualização dos perfis de clubes...")

# --- PERFIS DE CLUBES (COPIADOS DO SCRIPT ORIGINAL) ---
unique_club_details = {
    # INGLATERRA
    'liverpool': {'reputation': 'Mundial', 'difficulty': 'Fácil',
                  'objectives': {'league': 'Defender o título da Premier Division',
                                 'cup': 'Melhorar o desempenho nas copas',
                                 'continental': 'Competir pelo título da Champions Cup'},
                  'strengths': ['Fusão tática Klopp-Slot', 'Controle de posse de bola', 'Ataque implacável',
                                'Mohamed Salah'], 'weaknesses': ['Profundidade do elenco para múltiplas frentes'],
                  'challenges': ['Sustentar o domínio após uma temporada quase perfeita',
                                 'Construir uma nova dinastia sob o comando de Arne Slot.']},
    'arsenal': {'reputation': 'Mundial', 'difficulty': 'Médio',
                'objectives': {'league': 'Finalmente vencer a Premier League', 'cup': 'Conquistar um troféu doméstico',
                               'continental': 'Repetir a boa campanha na Champions Cup'},
                'strengths': ['Defesa mais sólida da liga', 'Sucesso na Europa', 'Núcleo de jogadores consistente'],
                'weaknesses': ['Fragilidade mental em momentos chave', 'Incapacidade de segurar vantagens',
                               'Falta de profundidade no ataque'],
                'challenges': ['Superar o fardo psicológico de ser "quase campeão"',
                               'Adicionar resiliência e poder de fogo para a reta final.']},
    'manchester_city': {'reputation': 'Mundial', 'difficulty': 'Difícil',
                        'objectives': {'league': 'Voltar a brigar pelo título', 'cup': 'Vencer um troféu importante',
                                       'continental': 'Ir longe na Champions Cup'},
                        'strengths': ['Qualidade individual de craques', 'Joško Gvardiol',
                                      'Potencial para reviravolta'],
                        'weaknesses': ['"Rodri-dependência"', 'Meio-campo vulnerável', 'Falta de "fome" competitiva'],
                        'challenges': ['Gerenciar o fim de um ciclo vitorioso',
                                       'Rejuvenescer o elenco com jogadores "famintos" e motivados.']},
    'chelsea': {'reputation': 'Mundial', 'difficulty': 'Fácil',
                'objectives': {'league': 'Brigar pelo título da Premier Division', 'cup': 'Vencer uma copa doméstica',
                               'continental': 'Competir na Champions Cup'},
                'strengths': ['Mentalidade vencedora restaurada', 'Resiliência em jogos difíceis',
                              'Meio-campo em grande forma (Caicedo, Enzo)'],
                'weaknesses': ['Inconsistência na liga', 'Decepção com contratações caras (Nkunku)'],
                'challenges': ['Transformar o sucesso nas copas em uma campanha consistente pelo título da liga.',
                               'Integrar reforços de forma eficaz.']},
    'newcastle_united': {'reputation': 'Continental', 'difficulty': 'Fácil',
                         'objectives': {'league': 'Consolidar-se no Top 4', 'cup': 'Defender o título da EFL Cup',
                                        'continental': 'Passar da fase de grupos da Champions Cup'},
                         'strengths': ['Fim do jejum de títulos', 'Ataque prolífico (Alexander Isak)',
                                       'Meio-campo formidável (Tonali, Bruno G., Joelinton)'],
                         'weaknesses': ['Profundidade do elenco testada por lesões'],
                         'challenges': ['Gerenciar as exigências de competir em múltiplas frentes',
                                        'Consolidar o clube como uma força de elite na Inglaterra e Europa.']},
    'aston_villa': {'reputation': 'Continental', 'difficulty': 'Médio',
                    'objectives': {'league': 'Garantir vaga na Champions League', 'cup': 'Chegar à final da FA Cup'},
                    'strengths': ['Competitividade na Europa (campanha na UCL)', 'Meio-campo forte (Youri Tielemans)',
                                  'Liderança defensiva (Ezri Konsa)'],
                    'weaknesses': ['Fraquejar em jogos grandes decisivos', 'Inconsistência durante a temporada'],
                    'challenges': ['Corrigir a instabilidade que custou a vaga no Top 4',
                                   'Manter a trajetória ascendente sob Unai Emery.']},
    'tottenham_hotspur': {'reputation': 'Continental', 'difficulty': 'Muito Difícil',
                          'objectives': {'league': 'Evitar o rebaixamento', 'cup': 'Fazer uma campanha digna',
                                         'continental': 'Defender o título da Liga Europa'},
                          'strengths': ['Vencedor da Liga Europa', 'Brennan Johnson em grande fase'],
                          'weaknesses': ['Campanha doméstica desastrosa', 'Defesa terrível',
                                         'Elenco extremamente curto'], 'challenges': [
            'O paradoxo: montar um time para a Champions League com uma base que quase foi rebaixada.',
            'Superar os problemas estruturais profundos do clube.']},
    'manchester_united': {'reputation': 'Mundial', 'difficulty': 'Muito Difícil',
                          'objectives': {'league': 'Voltar à metade de cima da tabela',
                                         'cup': 'Tentar vencer uma copa para salvar a honra'},
                          'strengths': ['Potencial para reconstrução total'],
                          'weaknesses': ['Pior campanha da história na PL', 'Recordes negativos de derrotas e gols',
                                         'Cultura de clube em crise'],
                          'challenges': ['Uma reconstrução monumental do elenco e da cultura do clube.',
                                         'Usar a ausência de competições europeias para focar na liga.']},

    # ESPANHA
    'real_madrid': {'reputation': 'Mundial', 'difficulty': 'Fácil',
                    'objectives': {'league': 'Conquistar o título da LALIGA', 'cup': 'Vencer a Copa Nacional',
                                   'continental': 'Vencer a Champions Cup'},
                    'strengths': ['Elenco Estelar', 'Tradição', 'Poder Financeiro'],
                    'weaknesses': ['Alta Pressão da Mídia', 'Profundidade Defensiva'],
                    'challenges': ['Gerenciar o ego das superestrelas', 'Manter a dominância em todas as frentes.']},
    'fc_barcelona': {'reputation': 'Mundial', 'difficulty': 'Difícil',
                     'objectives': {'league': 'Brigar pelo título', 'cup': 'Chegar às semifinais',
                                    'continental': 'Passar da fase de grupos'},
                     'strengths': ['Jovens Talentos (La Masia)', 'Filosofia de Jogo', 'Apoio da Torcida'],
                     'weaknesses': ['Inconsistência Defensiva', 'Situação Financeira'],
                     'challenges': ['Reconstruir o time enquanto compete em alto nível',
                                    'Lidar com limitações financeiras.']},
    'atlético_de_madrid': {'reputation': 'Continental', 'difficulty': 'Médio',
                           'objectives': {'league': 'Garantir vaga na Champions Cup',
                                          'cup': 'Chegar às quartas de final',
                                          'continental': 'Chegar às oitavas de final'},
                           'strengths': ['Defesa Sólida', 'Intensidade', 'Força Tática'],
                           'weaknesses': ['Criatividade Ofensiva', 'Elenco envelhecido'],
                           'challenges': ['Competir financeiramente com Real e Barça',
                                          'Manter a identidade de "time guerreiro".']},
    'villarreal_cf': {'reputation': 'Nacional', 'difficulty': 'Médio',
                      'objectives': {'league': 'Brigar por vaga em competições europeias',
                                     'cup': 'Chegar às oitavas de final'},
                      'strengths': ['Organização tática', 'Boa gestão', 'Experiência em copas'],
                      'weaknesses': ['Orçamento limitado', 'Profundidade do elenco'],
                      'challenges': ['Surpreender os gigantes da liga', 'Manter a consistência entre as competições.']},
    'athletic_club': {'reputation': 'Nacional', 'difficulty': 'Difícil',
                      'objectives': {'league': 'Brigar por vaga em competições europeias', 'cup': 'Chegar à final'},
                      'strengths': ['Identidade Basca única', 'Forte apoio local', 'Excelente formação de atletas'],
                      'weaknesses': ['Mercado de transferências restrito', 'Falta de um goleador'],
                      'challenges': ['Competir em alto nível usando apenas jogadores bascos',
                                     'Maximizar o potencial da academia.']},

    # ALEMANHA
    'fc_bayern_münchen': {'reputation': 'Mundial', 'difficulty': 'Muito Fácil',
                          'objectives': {'league': 'Vencer a Bundesliga', 'cup': 'Vencer a DFB-Pokal',
                                         'continental': 'Vencer a Champions Cup'},
                          'strengths': ['Domínio Doméstico', 'Mentalidade Vencedora', 'Eficiência Alemã'],
                          'weaknesses': ['Profundidade em algumas posições'],
                          'challenges': ['Manter a hegemonia na Alemanha', 'Evitar a complacência.']},
    'borussia_dortmund': {'reputation': 'Continental', 'difficulty': 'Médio',
                          'objectives': {'league': 'Garantir vaga na Champions Cup',
                                         'cup': 'Chegar à final da DFB-Pokal',
                                         'continental': 'Passar da fase de grupos'},
                          'strengths': ['Desenvolvimento de Jovens', 'Torcida Apaixonada (Muralha Amarela)',
                                        'Transições rápidas'],
                          'weaknesses': ['Venda constante de craques', 'Inconsistência defensiva'],
                          'challenges': ['Quebrar a hegemonia do Bayern', 'Segurar suas principais promessas.']},
    'bayer_04_leverkusen': {'reputation': 'Continental', 'difficulty': 'Fácil',
                            'objectives': {'league': 'Brigar pelo título da Bundesliga', 'cup': 'Chegar à final'},
                            'strengths': ['Futebol ofensivo e veloz', 'Scouting inteligente', 'Elenco equilibrado'],
                            'weaknesses': ['Histórico de "quase"', 'Pressão em momentos decisivos'],
                            'challenges': ['Finalmente conquistar o título da Bundesliga',
                                           'Provar que pode ser um campeão consistente.']},
    'rb_leipzig': {'reputation': 'Continental', 'difficulty': 'Fácil',
                   'objectives': {'league': 'Garantir vaga na Champions Cup', 'cup': 'Vencer a DFB-Pokal'},
                   'strengths': ['Estrutura moderna', 'Foco em jovens talentos', 'Intensidade física'],
                   'weaknesses': ['Falta de tradição', 'Rejeição de torcidas rivais'],
                   'challenges': ['Estabelecer-se como a segunda força da Alemanha',
                                  'Vencer a liga pela primeira vez.']},

    # ITÁLIA
    'juventus': {'reputation': 'Mundial', 'difficulty': 'Difícil',
                 'objectives': {'league': 'Voltar a brigar pelo título da Serie A',
                                'cup': 'Chegar à final da Coppa Italia'},
                 'strengths': ['História e Tradição', 'Base de jovens italianos', 'Solidez defensiva'],
                 'weaknesses': ['Problemas fora de campo', 'Falta de criatividade no meio'],
                 'challenges': ['Reconstruir a imagem e o elenco do clube', 'Retomar o protagonismo na Itália.']},
    'inter': {'reputation': 'Continental', 'difficulty': 'Fácil',
              'objectives': {'league': 'Conquistar o título da Serie A', 'cup': 'Vencer a Coppa Italia'},
              'strengths': ['Sistema tático consolidado', 'Ataque forte', 'Experiência'],
              'weaknesses': ['Profundidade do elenco', 'Vulnerabilidade financeira'],
              'challenges': ['Manter o nível competitivo com recursos limitados', 'Brigar em múltiplas frentes.']},
    'milan': {'reputation': 'Continental', 'difficulty': 'Médio',
              'objectives': {'league': 'Brigar pelo título da Serie A', 'cup': 'Chegar às semifinais'},
              'strengths': ['Jogadores jovens e rápidos', 'História na Champions Cup', 'Defesa sólida'],
              'weaknesses': ['Inexperiência em jogos grandes', 'Dependência de craques'],
              'challenges': ['Voltar a ser uma potência na Europa',
                             'Equilibrar desenvolvimento e resultados imediatos.']},
    'as_roma': {'reputation': 'Continental', 'difficulty': 'Médio',
                'objectives': {'league': 'Brigar por vaga na Champions Cup', 'cup': 'Chegar às semifinais'},
                'strengths': ['Apoio fervoroso da torcida', 'Jogadores de nome', 'Força em casa'],
                'weaknesses': ['Inconsistência', 'Dependência emocional'],
                'challenges': ['Transformar a paixão da torcida em títulos',
                               'Manter a regularidade durante toda a temporada.']},
    'ssc_napoli': {'reputation': 'Continental', 'difficulty': 'Médio',
                   'objectives': {'league': 'Brigar por vaga na Champions Cup', 'cup': 'Fazer uma boa campanha'},
                   'strengths': ['Ataque talentoso', 'Entusiasmo da cidade', 'Capacidade de surpreender'],
                   'weaknesses': ['Pressão pós-título', 'Venda de jogadores importantes'],
                   'challenges': ['Provar que o sucesso recente não foi um acaso',
                                  'Lidar com a saída de peças-chave.']},

    # FRANÇA
    'paris_saint-germain': {'reputation': 'Mundial', 'difficulty': 'Muito Fácil',
                            'objectives': {'league': 'Vencer a Ligue 1 com folga', 'cup': 'Vencer a Coupe de France',
                                           'continental': 'Conquistar a Champions Cup'},
                            'strengths': ['Poder Financeiro Ilimitado', 'Superestrelas Mundiais', 'Marca Global'],
                            'weaknesses': ['Falta de equilíbrio no elenco', 'Pressão pelo título continental'],
                            'challenges': ['O objetivo final e único: vencer a Champions Cup.',
                                           'Gerenciar um vestiário cheio de estrelas.']},
    'olympique_lyonnais': {'reputation': 'Nacional', 'difficulty': 'Médio',
                           'objectives': {'league': 'Brigar por vaga em competições europeias',
                                          'cup': 'Chegar às quartas de final'},
                           'strengths': ['Excelente academia de jovens', 'Tradição', 'Bom potencial'],
                           'weaknesses': ['Inconsistência', 'Falta de investimento'],
                           'challenges': ['Voltar a ser protagonista na Ligue 1',
                                          'Desenvolver e manter os talentos da base.']},
    'losc_lille': {'reputation': 'Nacional', 'difficulty': 'Difícil',
                   'objectives': {'league': 'Terminar na metade de cima da tabela', 'cup': 'Fazer uma boa campanha'},
                   'strengths': ['Defesa organizada', 'Scouting eficiente', 'Capacidade de surpreender'],
                   'weaknesses': ['Venda constante de jogadores', 'Orçamento limitado'],
                   'challenges': ['Repetir o sucesso recente sem os mesmos recursos',
                                  'Encontrar novas joias no mercado.']},

    # PORTUGAL
    'benfica': {'reputation': 'Continental', 'difficulty': 'Fácil',
                'objectives': {'league': 'Conquistar o título da Liga Portugal', 'cup': 'Vencer a Taça de Portugal'},
                'strengths': ['Academia de Talentos (Seixal)', 'Scouting de qualidade', 'Apoio massivo'],
                'weaknesses': ['Venda constante de jogadores', 'Pressão por resultados imediatos'],
                'challenges': ['Competir financeiramente na Europa', 'Manter a base do time a cada temporada.']},
    'fc_porto': {'reputation': 'Continental', 'difficulty': 'Fácil',
                 'objectives': {'league': 'Conquistar o título da Liga Portugal', 'cup': 'Vencer a Taça de Portugal'},
                 'strengths': ['Mentalidade competitiva', 'Força no mercado Sul-Americano', 'Experiência'],
                 'weaknesses': ['Limitações financeiras', 'Elenco envelhecido'],
                 'challenges': ['Lutar contra rivais mais ricos', 'Renovar o elenco com sabedoria.']},
    'sporting_cp': {'reputation': 'Continental', 'difficulty': 'Médio',
                    'objectives': {'league': 'Brigar pelo título da Liga Portugal', 'cup': 'Chegar à final'},
                    'strengths': ['Formação de talentos (Academia de Alcochete)', 'Treinador de qualidade',
                                  'Organização tática'],
                    'weaknesses': ['Menor poder financeiro que os rivais', 'Profundidade do elenco'],
                    'challenges': ['Competir de igual para igual com Benfica e Porto',
                                   'Manter o treinador e os principais jogadores.']},

    # HOLANDA
    'ajax': {'reputation': 'Continental', 'difficulty': 'Médio',
             'objectives': {'league': 'Brigar pelo título da Eredivisie', 'cup': 'Chegar à final da KNVB Beker'},
             'strengths': ['Filosofia de Futebol Total', 'Academia De Toekomst', 'Desenvolvimento de jovens'],
             'weaknesses': ['Desmanche constante do time', 'Inexperiência em competições europeias'],
             'challenges': ['Manter-se relevante na Europa sendo um clube vendedor',
                            'Reconstruir o time a cada ciclo.']},
    'feyenoord': {'reputation': 'Nacional', 'difficulty': 'Médio',
                  'objectives': {'league': 'Garantir vaga em competições europeias', 'cup': 'Chegar às semifinais'},
                  'strengths': ['Torcida fanática (Het Legioen)', 'Intensidade', 'Tradição'],
                  'weaknesses': ['Poder financeiro limitado', 'Inconsistência fora de casa'],
                  'challenges': ['Quebrar a dominância de Ajax e PSV', 'Fazer uma boa campanha na Europa.']},
}

generic_profiles = {
    'generic_title_contender': {'reputation': 'Continental', 'difficulty': 'Fácil',
                                'objectives': {'league': 'Brigar pelo título nacional',
                                               'cup': 'Chegar às fases finais da copa',
                                               'continental': 'Fazer uma boa campanha continental'},
                                'strengths': ['Elenco forte', 'Tradição'],
                                'weaknesses': ['Pressão por títulos', 'Rivalidade acirrada'],
                                'challenges': ['Superar os principais rivais nos jogos decisivos.']},
    'generic_continental_spot': {'reputation': 'Nacional', 'difficulty': 'Médio',
                                 'objectives': {'league': 'Brigar por vaga em competições continentais',
                                                'cup': 'Fazer uma boa campanha na copa'},
                                 'strengths': ['Time Organizado', 'Apoio Local'],
                                 'weaknesses': ['Orçamento Limitado', 'Elenco Curto'],
                                 'challenges': ['Surpreender os grandes clubes', 'Manter os melhores jogadores.']},
    'generic_mid_table': {'reputation': 'Nacional', 'difficulty': 'Difícil',
                          'objectives': {'league': 'Terminar no meio da tabela, sem sustos',
                                         'cup': 'Passar das primeiras fases'},
                          'strengths': ['Defesa Sólida', 'Jogo Coletivo'],
                          'weaknesses': ['Falta de um craque', 'Dificuldade em marcar gols'],
                          'challenges': ['Evitar a briga contra o rebaixamento',
                                         'Conseguir uma venda expressiva para equilibrar as contas.']},
    'generic_relegation_battle': {'reputation': 'Local', 'difficulty': 'Muito Difícil',
                                  'objectives': {'league': 'Lutar para evitar o rebaixamento',
                                                 'cup': 'Vencer a primeira rodada'},
                                  'strengths': ['Garra', 'Apoio da torcida em casa'],
                                  'weaknesses': ['Qualidade técnica limitada', 'Orçamento baixo'],
                                  'challenges': ['Sobreviver na primeira divisão',
                                                 'Encontrar talentos baratos ou por empréstimo.']},
    'generic_promotion_candidate': {'reputation': 'Nacional', 'difficulty': 'Médio',
                                    'objectives': {'league': 'Conseguir a promoção para a divisão principal',
                                                   'cup': 'Tentar surpreender um time da elite'},
                                    'strengths': ['Um dos melhores elencos da divisão', 'Estrutura superior'],
                                    'weaknesses': ['Pressão para subir', 'Jogos fisicamente exigentes'],
                                    'challenges': ['Confirmar o favoritismo em uma liga longa e desgastante.']},
    'generic_sleeping_giant': {'reputation': 'Continental', 'difficulty': 'Difícil',
                               'objectives': {'league': 'Voltar à primeira divisão', 'cup': 'Chegar longe na copa'},
                               'strengths': ['Grande torcida', 'História de títulos', 'Estrutura de time grande'],
                               'weaknesses': ['Elenco caro para a divisão', 'Má gestão recente'],
                               'challenges': ['Lidar com a pressão de ser o "time a ser batido" na segunda divisão.']},
    'generic_moneyball': {'reputation': 'Nacional', 'difficulty': 'Difícil',
                          'objectives': {'league': 'Terminar na metade de cima da tabela', 'cup': 'Revelar um jogador'},
                          'strengths': ['Scouting baseado em dados', 'Gestão financeira inteligente', 'Time jovem'],
                          'weaknesses': ['Falta de poder físico', 'Venda constante dos destaques'],
                          'challenges': ['Provar que a análise de dados pode superar orçamentos maiores.']},
    'generic_overachiever': {'reputation': 'Nacional', 'difficulty': 'Médio',
                             'objectives': {'league': 'Lutar por uma vaga na Europa',
                                            'cup': 'Chegar às semifinais de uma copa'},
                             'strengths': ['Estilo de contra-ataque letal', 'Defesa sólida', 'Resiliência mental'],
                             'weaknesses': ['Queda de forma no final da temporada', 'Profundidade do elenco'],
                             'challenges': ['Provar que a campanha histórica não foi um acaso',
                                            'Gerir as novas expectativas da torcida e diretoria.']},
    'generic_transition_year': {'reputation': 'Nacional', 'difficulty': 'Médio',
                                'objectives': {'league': 'Terminar na metade de cima da tabela',
                                               'cup': 'Integrar novos jogadores'},
                                'strengths': ['Capacidade de virar jogos', 'Ataque diversificado',
                                              'Novas contratações promissoras'],
                                'weaknesses': ['Incapacidade de segurar vantagens', 'Sofrer gols nos minutos finais',
                                               'Vulnerabilidade em bolas paradas'],
                                'challenges': ['Corrigir a fragilidade defensiva em momentos cruciais',
                                               'Transformar um ano de transição em sucesso sustentado.']},
    'generic_record_breaker': {'reputation': 'Nacional', 'difficulty': 'Fácil',
                               'objectives': {'league': 'Brigar por uma vaga na Europa',
                                              'cup': 'Fazer uma boa campanha'},
                               'strengths': ['Estilo de pressão energética', 'Bom desempenho contra os grandes',
                                             'Política de transferências inteligente'],
                               'weaknesses': ['Inconsistência contra times menores'],
                               'challenges': ['Manter os melhores jogadores e o treinador cobiçado',
                                              'Evoluir de "surpresa" para um candidato europeu consistente.']},
    'generic_cup_hero': {'reputation': 'Nacional', 'difficulty': 'Médio',
                         'objectives': {'league': 'Terminar no meio da tabela', 'cup': 'Defender o título da copa',
                                        'continental': 'Fazer uma boa campanha na Liga Europa'},
                         'strengths': ['Conquista histórica de troféu', 'Equipe revitalizada por novo técnico',
                                       'Defesa sólida'],
                         'weaknesses': ['Início de temporada ruim', 'Pressão de ser o "time a ser batido" na copa'],
                         'challenges': ['Gerir as expectativas após um sucesso monumental',
                                        'Competir na Europa sem negligenciar a liga.']},
    'generic_relegated_fighter': {'reputation': 'Local', 'difficulty': 'Muito Difícil',
                                  'objectives': {'league': 'Voltar para a primeira divisão imediatamente',
                                                 'cup': 'Focar na liga'},
                                  'strengths': ['Estilo de jogo corajoso e agressivo', 'Apoio da diretoria ao técnico'],
                                  'weaknesses': ['Defesa de nível inferior', 'Dificuldade em marcar gols',
                                                 'Incapacidade de proteger vantagens'],
                                  'challenges': ['Manter a base do time e o técnico após o rebaixamento',
                                                 'Voltar mais forte e experiente.']},
    'generic_relegated_disaster': {'reputation': 'Local', 'difficulty': 'Muito Difícil',
                                   'objectives': {'league': 'Reconstruir para tentar subir em 2 anos',
                                                  'cup': 'Dar chance aos jovens'},
                                   'strengths': ['Oportunidade para uma reconstrução total'],
                                   'weaknesses': ['Pior desempenho da história', 'Táticas inflexíveis',
                                                  'Moral do elenco inexistente'],
                                   'challenges': ['Uma reconstrução massiva no Championship sob nova gestão.',
                                                  'Evitar o colapso total do clube.']},
    'generic_third_division_promotion': {'reputation': 'Nacional', 'difficulty': 'Médio',
                                         'objectives': {'league': 'Subir para a segunda divisão',
                                                        'cup': 'Focar na liga'},
                                         'strengths': ['Time de ponta da divisão', 'Organização'],
                                         'weaknesses': ['Orçamento restrito', 'Pressão pelo acesso'],
                                         'challenges': ['Confirmar o favoritismo e garantir o acesso direto.']},
    'generic_third_division_playoffs': {'reputation': 'Local', 'difficulty': 'Difícil',
                                        'objectives': {'league': 'Lutar por uma vaga nos playoffs de promoção',
                                                       'cup': 'Focar na liga'},
                                        'strengths': ['Bom momento', 'Ataque eficiente'],
                                        'weaknesses': ['Elenco curto', 'Inconsistência'],
                                        'challenges': ['Manter a regularidade para chegar forte nos playoffs.']},
    'generic_third_division_mid_table': {'reputation': 'Local', 'difficulty': 'Difícil',
                                         'objectives': {'league': 'Se estabelecer na metade de cima da tabela',
                                                        'cup': 'Dar chance a jovens'},
                                         'strengths': ['Sem pressão pelo acesso', 'Desenvolvimento de jovens'],
                                         'weaknesses': ['Falta de poder de investimento', 'Qualidade limitada'],
                                         'challenges': [
                                             'Construir uma base sólida para brigar pelo acesso no futuro.']},
    'generic_third_division_relegation': {'reputation': 'Local', 'difficulty': 'Muito Difícil',
                                          'objectives': {'league': 'Evitar o rebaixamento para as divisões amadoras',
                                                         'cup': 'Focar na liga'},
                                          'strengths': ['Garra', 'Apoio da comunidade local'],
                                          'weaknesses': ['Elenco semi-profissional', 'Finanças precárias'],
                                          'challenges': ['Lutar pela sobrevivência e profissionalização do clube.']}

}
# --- FIM DOS PERFIS ---

try:
    conn = sqlite3.connect('../master_data.db')
    cursor = conn.cursor()
    print("Conexão com master_data.db bem-sucedida.")

    # 1. Carregar dados necessários do DB
    clubs_df = pd.read_sql_query("SELECT id, name, leagueName FROM clubs", conn)
    players_df = pd.read_sql_query("SELECT club_id, overall FROM players", conn)
    print(f"Dados de {len(clubs_df)} clubes e {len(players_df)} jogadores lidos.")

    # 2. Calcular Overall Médio dos Clubes e Ligas
    club_avg_overalls = players_df.groupby('club_id')['overall'].mean().to_dict()
    clubs_df['avg_overall'] = clubs_df['id'].map(club_avg_overalls).fillna(0)

    league_avg_overalls = clubs_df.groupby('leagueName')['avg_overall'].mean().to_dict()
    clubs_df['league_avg_overall'] = clubs_df['leagueName'].map(league_avg_overalls).fillna(0)

    print("Overall médio de clubes e ligas calculado.")

    # 3. Preparar os dados para inserção
    details_to_insert = []

    for index, club in clubs_df.iterrows():
        club_id = club['id']
        profile = {}

        if club_id in unique_club_details:
            profile = unique_club_details[club_id]
        else:
            # Lógica para atribuir perfil genérico
            club_ovr = club['avg_overall']
            league_ovr = club['league_avg_overall']
            diff = club_ovr - league_ovr if league_ovr > 0 else 0

            # Lógica simplificada (pode ser refinada como no script original)
            if diff >= 2.5:
                profile = generic_profiles.get('generic_title_contender')
            elif diff >= 1.0:
                profile = generic_profiles.get('generic_continental_spot')
            elif diff > -2.0:
                profile = generic_profiles.get('generic_mid_table')
            else:
                profile = generic_profiles.get('generic_relegation_battle')

        if not profile: continue  # Pula se nenhum perfil foi encontrado

        # Converte listas para string JSON
        strengths_json = json.dumps(profile.get('strengths', []))
        weaknesses_json = json.dumps(profile.get('weaknesses', []))
        challenges_json = json.dumps(profile.get('challenges', []))
        objectives = profile.get('objectives', {})

        details_to_insert.append((
            club_id,
            profile.get('reputation'),
            profile.get('difficulty'),
            objectives.get('league'),
            objectives.get('cup'),
            objectives.get('continental'),
            strengths_json,
            weaknesses_json,
            challenges_json
        ))

    # 4. Inserir/Atualizar dados na tabela club_details
    print(f"Preparando para inserir/atualizar detalhes de {len(details_to_insert)} clubes...")

    # INSERT OR REPLACE irá inserir novas linhas ou substituir as existentes se a club_id já estiver na tabela.
    cursor.executemany('''
        INSERT OR REPLACE INTO club_details (
            club_id, reputation, difficulty, objectives_league, objectives_cup,
            objectives_continental, strengths, weaknesses, challenges
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', details_to_insert)

    conn.commit()
    print(
        f"\nOperação concluída com sucesso! {cursor.rowcount} registros de detalhes de clubes foram inseridos/atualizados.")

except Exception as e:
    print(f"\nOcorreu um erro durante o processo: {e}")
    conn.rollback()
finally:
    if conn:
        conn.close()