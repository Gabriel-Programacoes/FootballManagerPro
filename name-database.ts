// name-database.ts

interface NameData {
    firstNames: string[];
    lastNames: string[];
}

export const NAMES_BY_COUNTRY: Record<string, NameData> = {
    "Alemanha": {
        firstNames: ["Rudolph", "Kevin", "Sven", "Marco", "Ralph", "Thomas", "Pavel", "Daniel", "Theodor", "Dirk", "Bernd", "Martin"],
        lastNames: ["Amsel", "Fuhrmann", "Theissen", "Vogler", "Moeller", "Neustadt", "Gärtner", "Hoffmann", "Winkel", "Vogel", "Zimmermann", "Eberhart", "Gaertner", "Weissmuller", "Pabst", "Oster"]
    },
    "Argentina": {
        firstNames: ["Enzo", "Bautista", "Benjamín", "Felipe", "Santino", "Valentín", "Joaquín", "Thiago", "Bastian", "Agustín", "Mateo", "Lautaro", "Lionel"],
        lastNames: ["Fernández", "Díaz", "González", "Rodríguez", "Gómez", "Pérez", "Martínez", "Romero", "Sánchez", "Torres", "Ramírez", "Flores", "Benítez", "Acosta"]
    },
    "Bélgica": {
        firstNames: ["Arthur", "Noah", "Jules", "Louis", "Adam", "Lucas", "Liam", "Victor", "Gabriel", "Léo", "Mohamed", "Oscar", "Mathis"],
        lastNames: ["Peeters", "Janssens", "Maes", "Jacobs", "Mertens", "Willems", "Claes", "Goossens", "Wouters", "De Smet", "Dubois", "Lambert", "Dupont"]
    },
    "Brasil": {
        firstNames: ["Samuel", "Miguel", "Otávio", "Cauã", "Breno", "Luan", "Murilo", "Davi", "Victor", "Eduardo", "Benjamin", "Mateo", "Alex"],
        lastNames: ["Rodrigues", "Carvalho", "Silva", "Costa", "Cunha", "Araujo", "Almeida", "Barbosa", "Furtado", "Goncalves", "Lima"]
    },
    "Croácia": {
        firstNames: ["Brajko", "Damir", "Darko", "Krunoslav", "Miro", "Saša", "Alojz", "Dražen", "Igor", "Slavko", "Milan", "Miroslav", "Branimir", "Miodrag"],
        lastNames: ["Delić", "Klarić", "Stanković", "Vučković", "Šimić", "Novaković", "Horvat", "Kovač", "Babić", "Kovačević", "Novak", "Grgić", "Marković", "Janković", "Poljak", "Lukić"]
    },
    "Espanha": {
        firstNames: ["Víctor", "Saturno", "París", "Rafel", "Dalmiro", "Candelario", "Menajem", "Américo", "Harold"],
        lastNames: ["Puente", "Quezada", "Urena", "Gómez", "Montalvo", "Cortes", "Montoya", "Fernandez", "Bañuelos", "Ruvalcaba", "Ayala"]
    },
    "França": {
        firstNames: ["Léo", "Gabriel", "Adam", "Louis", "Raphaël", "Arthur", "Jules", "Hugo", "Maël", "Lucas", "Sacha", "Noah", "Gabin"],
        lastNames: ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Leroy"]
    },
    "Holanda": {
        firstNames: ["Daan", "Bram", "Sem", "Lucas", "Milan", "Levi", "Luuk", "Thijs", "Jayden", "Tim", "Jesse", "Finn", "Mees", "Stijn"],
        lastNames: ["de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk", "Bakker", "Visser", "Smit", "Meijer", "de Boer", "Mulder", "de Groot", "Bos"]
    },
    "Inglaterra": {
        firstNames: ["Reece", "Timothy", "Mason", "Harrison", "Alastair", "Darragh", "Ruairidh", "Josh", "John", "Roderick", "James", "Edward", "Joshua", "Allen", "Brian", "Archibald", "Riley", "Tom", "Zack", "Cian"],
        lastNames: ["Pritchard", "Wilson", "Nicholls", "Day", "Docherty", "Martin", "Watt", "O'Sullivan", "Schwartz", "Ross", "Mckenzie", "Hatfield", "Carroll", "Murray", "Campbell", "Kerr", "Graham", "Cunningham", "Herbert", "Maclean", "Craig"]
    },
    "Itália": {
        firstNames: ["Benvenuto", "Guglielmo", "Fidenzio", "Gualtiero", "Cherubino", "Federico", "Cirillo", "Antonino", "Sebastiano", "Galdino", "Luca"],
        lastNames: ["Arcuri", "Trevisan", "Li Fonti", "Lombardi", "Ferrari", "Schiavone", "Manna", "Boni", "Esposito", "DeRose"]
    },
    "Polônia": {
        firstNames: ["Janek", "Włodzimierz", "Cibor", "Bartosz", "Eryk", "Bolesław", "Krystyn", "Krzyś", "Przemysław", "Bogumił", "Wiesław", "Sebastian"],
        lastNames: ["Woźniak", "Czerwinski", "Kowalski", "Nowak", "Jasiński", "Zieliński", "Duda", "Michalski", "Kaczmarek", "Gorski", "Jabłoński"]
    },
    "Portugal": {
        firstNames: ["Francisco", "Duarte", "Martim", "Afonso", "Tomás", "Gabriel", "Lourenço", "Rodrigo", "Miguel", "Santiago", "Diogo", "Guilherme", "Vicente"],
        lastNames: ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Jesus", "Sousa", "Fernandes", "Gonçalves", "Gomes", "Lopes"]
    },
    "Resto do Mundo": {
        firstNames: ["Taras", "Xenophon", "Samson", "Eric", "Herman", "Yevgraf", "Yevsey", "Rostislav", "Yaroslav", "Irakli"],
        lastNames: ["Izmaylov", "Maslov", "Shubin", "Galkin", "Yermakov", "Vasilyev", "Loginov", "Kozlov", "Volkov", "Kuznetsov", "Kalinin"]
    },
    // Uma lista de fallback para nomes mais genéricos ou de outras nacionalidades
    "Padrão": {
        firstNames: ["Arthur", "Adnan", "Umayr", "Troy", "Jens", "Luis", "Raphael", "Jaroslav", "Karel", "Ales", "Joris", "Jurg", "Fred", "Brandon", "Jawdah", "Michon", "Mu'nis", "Hassan", "Christian", "Abdul-Qayyum", "Josef", "Taco", "Dennis", "Burrell", "Latimer", "Love", "Aimé"],
        lastNames: ["Parenteau", "Asghar", "Kanaan", "Wright", "van Doremalen", "Procházka", "Klučka", "Zeman", "van der Pas", "Peet", "Ennis", "Ström", "Sabbagh", "Poppeliers", "Halabi", "Hadad", "Paulet", "Daher", "Laštůvka", "Berg", "Lundgren", "Gauvin", "Bonnet", "Carlsson", "Dennis", "Quraishi", "Holmberg"]
    }
};
