// Banco de preguntas de ABYSS.
// Cada pregunta tiene cuatro zonas de rareza (de más común a más rara) y una única «perla»:
// la respuesta «One in an Abyss», que vale 143 m.
// Las variantes de una misma respuesta se separan con «|» (la primera es la que se muestra).
// Las respuestas se comparan sin mayúsculas, sin tildes y sin artículos, y aceptan singular/plural.

export const PREGUNTAS = [
  {
    q: 'Una fruta',
    perla: 'camu camu',
    z: [
      'manzana, plátano|banana|banano, naranja, fresa|frutilla, pera, uva, sandía, melón, piña|ananá, mango',
      'kiwi, cereza, limón, durazno|melocotón, mandarina, papaya, coco, ciruela, frambuesa, arándano, higo, granada, mora',
      'maracuyá|parchita|fruta de la pasión, guayaba, lichi|litchi, chirimoya, níspero, caqui|kaki|persimón, pomelo|toronja, membrillo, grosella, lima, carambola, tamarindo, guanábana, zarzamora, nectarina, albaricoque|chabacano|damasco',
      'pitahaya|pitaya|fruta del dragón, rambután, mangostán, feijoa, kumquat|quinoto, durián, jaca|yaca, lúcuma, mamey, pomarrosa, zapote, tuna|higo chumbo, physalis|aguaymanto|uchuva, noni, cupuazú, borojó, naranjilla|lulo, jabuticaba, salak',
    ],
  },
  {
    q: 'Un animal del océano',
    perla: 'pulpo dumbo',
    z: [
      'tiburón, ballena, delfín, pulpo, pez, medusa, estrella de mar',
      'orca, foca, tortuga, calamar, cangrejo, langosta, caballito de mar, raya, mantarraya|manta, pez payaso, morsa, león marino|lobo marino, camarón|gamba, coral',
      'narval, manatí, beluga, pez espada, barracuda, morena, anguila, pez globo, erizo de mar|erizo, mejillón, ostra, almeja, nautilo, sepia, tiburón martillo|pez martillo, atún, sardina, krill, dugongo, cachalote',
      'pez remo, pez linterna, rape|pez abisal, quimera, nudibranquio, pez luna|mola, pepino de mar|holoturia, isópodo gigante|isópodo, calamar gigante, tiburón duende, pez hacha, sifonóforo, tiburón de groenlandia, pez gota, pez dragón, cangrejo yeti',
    ],
  },
  {
    q: 'Un instrumento musical',
    perla: 'nyckelharpa',
    z: [
      'guitarra, piano, batería, violín, flauta',
      'trompeta, saxofón|saxo, bajo, ukelele, arpa, violonchelo|chelo|cello, clarinete, tambor, acordeón, teclado, armónica, maracas',
      'contrabajo, oboe, fagot, trombón, tuba, viola, xilófono, marimba, banjo, mandolina, gaita, charango, cajón, bongó|bongos, castañuelas, triángulo, pandereta, timbal|timbales, órgano, sintetizador, claves, güiro, quena, platillos, trompa|corno, conga|congas, bandoneón',
      'theremín|theremin, sitar, didgeridoo|didyeridú, kalimba, cuatro, laúd, zampoña, ocarina, clavecín, celesta, handpan|hang, tabla, koto, shamisen, balalaika, erhu, cavaquinho, berimbau, glockenspiel, vibráfono, birimbao|arpa de boca, txalaparta, cornamusa',
    ],
  },
  {
    q: 'Un color',
    perla: 'glauco',
    z: [
      'rojo, azul, verde, amarillo, negro, blanco',
      'morado|violeta|púrpura, naranja|anaranjado, rosa|rosado, gris, marrón|café, celeste',
      'turquesa, beige, dorado, plateado, fucsia, lila, granate|bordó, cian, magenta, ocre, crema, salmón, coral, índigo, esmeralda, mostaza, oliva|verde oliva, lavanda, burdeos, añil, caqui',
      'bermellón, carmesí, cerúleo, ámbar, siena, cobalto|azul cobalto, ultramar|azul ultramar, aguamarina, chartreuse, malva, escarlata, sepia, bermejo, gualda, cárdeno, zafiro',
    ],
  },
  {
    q: 'Un deporte',
    perla: 'ajedrez boxeo|chessboxing',
    z: [
      'fútbol, baloncesto|básquet|básquetbol, tenis, natación, voleibol|vóley',
      'béisbol, golf, boxeo, ciclismo, atletismo, rugby, balonmano|handball, hockey, surf, esquí, pádel, kárate, judo',
      'esgrima, remo, polo, críquet|cricket, waterpolo, escalada, lucha, gimnasia, taekwondo, triatlón, patinaje, snowboard, bádminton, bolos, squash, tiro con arco, halterofilia, softbol, parkour, buceo, vela, piragüismo|canoa|kayak',
      'curling, sepak takraw, hurling, lacrosse, kabaddi, pelota vasca|frontón, jai alai, bobsleigh, skeleton, korfball, ultimate, petanca, pentatlón, biatlón, luge, croquet, quidditch, sumo, hockey subacuático',
    ],
  },
  {
    q: 'Algo que hay en una cocina',
    perla: 'pasapurés',
    z: [
      'nevera|refrigerador|refri|heladera|frigorífico, horno, estufa|cocina, cuchillo, plato, olla, sartén',
      'microondas, tenedor, cuchara, vaso, taza, fregadero|lavaplatos|pila, licuadora|batidora, tostadora, cafetera, mesa, silla, lavavajillas, servilleta, trapo',
      'rallador, colador, espátula, cucharón, tabla de cortar, abrelatas, sacacorchos, delantal, especiero, batidor|varillas, rodillo, jarra, tetera, freidora, campana|extractor, despensa, alacena, salero, molinillo',
      'mortero|molcajete, mandolina, tamiz, pelapapas|pelador, embudo, termómetro, manga pastelera, wok, comal, cascanueces, prensa ajos|prensador de ajos, soplete, chaira, olla exprés|olla a presión, tajín|tajine, cuscusera, paellera, temporizador',
    ],
  },
  {
    q: 'Un país de Europa',
    perla: 'Liechtenstein',
    z: [
      'España, Francia, Italia, Alemania, Portugal, Inglaterra|Reino Unido',
      'Grecia, Suiza, Bélgica, Holanda|Países Bajos, Suecia, Noruega, Rusia, Irlanda, Polonia, Austria, Dinamarca, Finlandia',
      'Croacia, Hungría, Rumanía|Rumania, República Checa|Chequia, Ucrania, Islandia, Escocia, Serbia, Bulgaria, Turquía, Luxemburgo, Eslovaquia, Eslovenia, Albania, Estonia, Letonia, Lituania, Mónaco, Andorra, Malta, Chipre',
      'San Marino, Vaticano|Ciudad del Vaticano, Moldavia, Bielorrusia, Macedonia del Norte|Macedonia, Montenegro, Bosnia y Herzegovina|Bosnia, Kosovo, Gales, Georgia, Armenia, Azerbaiyán',
    ],
  },
  {
    q: 'Algo que encuentras en una playa',
    perla: 'bolsa de sirena|huevo de raya',
    z: [
      'arena, agua, mar, sol, conchas, toalla, sombrilla',
      'olas, gaviota, castillo de arena, cangrejo, piedras, salvavidas, bañador|traje de baño|malla, protector solar|bloqueador|crema solar, palmera, pelota, cubo|balde, pala',
      'algas, medusa, chiringuito, hamaca|tumbona, faro, muelle, barco, velero, surfista, roca, caracola, estrella de mar, chanclas|sandalias|chancletas, gafas de sol|lentes de sol, nevera portátil|hielera, cometa|papalote|barrilete, tabla de surf',
      'mensaje en una botella|botella con mensaje, vidrio de mar|cristal de mar, ámbar gris, madera a la deriva, duna, erizo, cangrejo ermitaño, socorrista, pulga de mar, piedra pómez, nido de tortuga, detector de metales, tesoro, naufragio, ancla, fósil',
    ],
  },
  {
    q: 'Un animal de granja',
    perla: 'capón',
    z: [
      'vaca, cerdo|chancho|puerco|cochino, gallina, caballo, oveja',
      'cabra, pato, conejo, gallo, burro|asno, pollo, perro, gato, toro, pavo|guajolote',
      'ganso|oca, mula, cordero, ternero|becerro, codorniz, pavo real, buey, yegua, poni|pony, llama, alpaca, lechón',
      'búfalo, avestruz, gallina de guinea|pintada, emú, cuy|cobaya|conejillo de indias, abeja, caracol, yak, faisán, ciervo, chinchilla, gusano de seda, camello, dromedario',
    ],
  },
  {
    q: 'Una profesión',
    perla: 'farero',
    z: [
      'médico|doctor, profesor|maestro, abogado, bombero, policía, ingeniero',
      'enfermero, cocinero|chef, arquitecto, dentista, veterinario, piloto, carpintero, panadero, mecánico, electricista, contador|contable, periodista, actor, cantante, músico',
      'fontanero|plomero, psicólogo, farmacéutico, peluquero, albañil, astronauta, cartero, jardinero, sastre, carnicero, pescadero, agricultor|granjero, bibliotecario, fotógrafo, escritor, traductor, programador, juez, notario, taxista, camarero|mesero, fisioterapeuta, cirujano, biólogo',
      'herrero, relojero, zapatero, apicultor, cerrajero, deshollinador, sumiller|sommelier, lutier|luthier, taxidermista, oceanógrafo, vulcanólogo, actuario, joyero, tonelero, ebanista, curtidor, buzo, archivero, florista, alfarero, guardabosques, enólogo, cartógrafo',
    ],
  },
  {
    q: 'Algo que vuela',
    perla: 'colugo|lémur volador',
    z: [
      'avión, pájaro|ave, mosca, helicóptero, mariposa',
      'cometa|papalote|barrilete, globo, abeja, murciélago, mosquito, águila, dron, cohete, paloma, avispa',
      'libélula, avioneta, parapente, ala delta, zepelín|dirigible, polilla, colibrí, halcón, búho|lechuza, gaviota, hoja, avión de papel, ovni|platillo volante, nave espacial, cóndor, saltamontes, mariquita|catarina, globo aerostático, frisbee|disco volador',
      'ardilla voladora, pez volador, diente de león, semilla de arce, polen, ceniza, pluma, autogiro, bumerán|boomerang, satélite, vencejo, albatros, pterodáctilo, alfombra mágica, escoba, dragón',
    ],
  },
  {
    q: 'Algo redondo',
    perla: 'ojo de buey',
    z: [
      'pelota|balón, sol, luna, rueda, plato, moneda',
      'naranja, reloj, anillo, botón, pizza, globo, galleta, planeta, tierra, ojo, disco|cd, dona|donut|rosquilla',
      'aro, volante, tambor, tortilla, sandía, burbuja, perla, canica, cebolla, tomate, lenteja, guisante|arveja|chícharo, globo terráqueo, brújula, tapa, sombrero',
      'rotonda|glorieta, escotilla, iris, pupila, gota, mandala, lente, pandero, frisbee, hula hula|ula ula, neumático, pozo, arandela, engranaje, aceituna, garbanzo, uva, bola de nieve',
    ],
  },
  {
    q: 'Algo que pica',
    perla: 'fibra de vidrio',
    z: [
      'chile|ají|picante, abeja, mosquito, pimienta',
      'avispa, ortiga, jalapeño, salsa, wasabi, mostaza, hormiga, pulga, piojo',
      'rábano, jengibre, ajo, cebolla, tabasco, habanero, alacrán|escorpión, medusa, sarna, lana, araña, pimentón, cayena, curry, chinche',
      'rábano picante, sarpullido|erupción, urticaria, garrapata, tábano, jején, guindilla, chipotle, sriracha, harissa, pimienta de sichuan, varicela, pez escorpión, pez piedra',
    ],
  },
  {
    q: 'Algo que se lleva en la cabeza',
    perla: 'escafandra',
    z: [
      'gorra, sombrero, casco',
      'gorro, diadema|cintillo|vincha, pañuelo, boina, corona, gafas|lentes, auriculares|cascos, peluca',
      'turbante, capucha, velo, tiara, bandana, pasamontañas, visera, sombrero de copa, gorro de baño, orejeras, gorro de lana',
      'bombín, chistera, fez, kipá, mitra, sombrero de paja, panamá, sombrero vueltiao, chupalla, birrete, yelmo, tocado, mantilla, sueste',
    ],
  },
  {
    q: 'Un postre',
    perla: 'zabaione|sabayón',
    z: [
      'helado, pastel|tarta|torta, flan, galletas',
      'brownie, tiramisú, gelatina, arroz con leche, churros, natillas, tarta de queso|cheesecake, mousse, crepa|crepe|panqueque, dona|donut',
      'tres leches, profiteroles, alfajor, merengue, magdalena|muffin|cupcake, macedonia|ensalada de frutas, bizcocho, budín|pudin, sorbete, cuajada, leche frita, torrijas, banana split, crema catalana|creme brulee, panna cotta, baklava, strudel, crumble',
      'pavlova, tarta tatin, sacher, selva negra, brigadeiro, suspiro limeño, mazamorra, cocada, picarones, quesillo, mochi, cannoli, kulfi, gulab jamun, carlota, bienmesabe, dulce de leche',
    ],
  },
  {
    q: 'Un animal con rayas',
    perla: 'tilacino|lobo de tasmania|tigre de tasmania',
    z: [
      'cebra, tigre',
      'abeja, mapache, zorrillo|mofeta, pez payaso, serpiente, gato, avispa',
      'okapi, lémur, ardilla, tejón, pez cirujano, coralillo|serpiente coral, hiena, lagartija, oruga, pez león, tapir, ardilla listada|chipmunk',
      'numbat, bongo, kudú, nyala, quagga, cebra de grevy, perca, pez ángel, chinche, escarabajo de la papa, pez tigre',
    ],
  },
  {
    q: 'Algo que tiene teclas o botones',
    perla: 'pianola',
    z: [
      'teclado, piano, teléfono|móvil|celular, control remoto|mando',
      'computadora|ordenador, calculadora, ascensor|elevador, microondas, camisa, chaqueta, reloj, consola, cámara',
      'acordeón, máquina de escribir, cajero automático, lavadora, radio, abrigo, timbre, impresora, sintetizador, caja registradora, pantalón, teléfono fijo',
      'saxofón, clarinete, órgano, telégrafo, caja fuerte, interfono|portero automático, bandoneón, clavecín, fax, tamagotchi, botonera, mando de la tele',
    ],
  },
  {
    q: 'Un idioma',
    perla: 'silbo gomero',
    z: [
      'inglés, español|castellano, francés, chino|mandarín',
      'alemán, italiano, portugués, japonés, ruso, árabe, coreano',
      'catalán, euskera|vasco, gallego, griego, latín, hindi, turco, neerlandés|holandés, sueco, polaco, hebreo, quechua, guaraní, náhuatl, esperanto, noruego, danés',
      'sánscrito, suajili|swahili, aimara|aymara, mapudungun, maya, tagalo, vietnamita, tailandés, persa|farsi, urdu, bengalí, gaélico, islandés, finlandés, húngaro, klingon, élfico|quenya|sindarin, zulú, amhárico, maorí, wayuunaiki, occitano, asturiano|bable, yidis|yiddish',
    ],
  },
  {
    q: 'Una parte del cuerpo',
    perla: 'filtrum|surco nasolabial',
    z: [
      'mano, pie, cabeza, brazo, pierna, ojo, boca, nariz',
      'oreja, dedo, rodilla, codo, corazón, cuello, espalda, hombro, estómago|barriga|panza, pelo|cabello, uña, diente, lengua',
      'tobillo, muñeca, ceja, pestaña, hígado, riñón, pulmón, cerebro, columna, cadera, mejilla, barbilla|mentón, frente, labio, ombligo, talón, pantorrilla, muslo, costilla, cráneo, piel',
      'clavícula, esternón, tibia, peroné, fémur, rótula, coxis, apéndice, páncreas, bazo, tímpano, yunque, estribo, úvula|campanilla, epiglotis, axila|sobaco, nuca, lóbulo, iris, córnea, retina, tendón de aquiles, diafragma, esófago, tráquea',
    ],
  },
  {
    q: 'Algo de color amarillo',
    perla: 'submarino amarillo|yellow submarine',
    z: [
      'sol, plátano|banana, limón, pollito, queso',
      'maíz|elote|choclo, taxi, girasol, yema, mostaza, oro, patito de goma|pato de goma, estrella, mantequilla',
      'canario, abeja, autobús escolar, piña, semáforo, lápiz, pikachu, simpson|los simpson, minion, post-it, mango, tulipán, margarita',
      'azufre, narciso, diente de león, mimosa, ámbar, cúrcuma, azafrán, caléndula, citrino, rana dorada, pez cirujano amarillo, bob esponja',
    ],
  },
  {
    q: 'Algo que hay en el fondo del mar',
    perla: 'nieve marina',
    z: [
      'arena, peces, algas, coral, piedras|rocas',
      'conchas, naufragio|barco hundido, tesoro, estrella de mar, pulpo, cangrejo, ancla, basura, erizo',
      'cofre, esponja, anémona, volcán, cueva, perla, ostra, submarino, cable submarino|cables, raya, buzo, plástico',
      'fosa|fosa de las marianas, fumarola|chimenea hidrotermal, nódulos de manganeso|nódulo, isópodo, pepino de mar|holoturia, sedimento, lava, atlántida, titanic, kraken, caída de ballena|ballena muerta, gusano tubícola',
    ],
  },
  {
    q: 'Una ciudad de Latinoamérica',
    perla: 'Puerto Williams',
    z: [
      'Ciudad de México|México|CDMX, Buenos Aires, Bogotá, Lima, Santiago',
      'Caracas, Quito, Montevideo, La Habana|Habana, Río de Janeiro, São Paulo|Sao Paulo, Medellín, Guadalajara, Cancún, Panamá, San José',
      'Cali, Cartagena, Monterrey, Córdoba, Rosario, Valparaíso, Cusco|Cuzco, La Paz, Asunción, Guayaquil, Santo Domingo, San Juan, Tegucigalpa, Managua, San Salvador, Guatemala, Puebla, Mendoza, Arequipa, Brasilia, Salvador de Bahía, Oaxaca, Tijuana, Barranquilla, Maracaibo, Sucre',
      'Ushuaia, Iquitos, Potosí, Valdivia, Punta Arenas, Cuenca, Popayán, Mompox, Colonia del Sacramento, Mérida, Valladolid, Antigua, Granada, León, Trinidad, Manaos, Belém, Florianópolis, Recife, Ouro Preto, San Cristóbal de las Casas, Tulum, Salta, Jujuy, Cochabamba, Santa Cruz, Encarnación, Paramaribo, Cayena, Georgetown',
    ],
  },
  {
    q: 'Un dinosaurio o animal prehistórico',
    perla: 'hallucigenia',
    z: [
      'tiranosaurio|t rex|tiranosaurio rex, velociraptor|raptor, triceratops',
      'brontosaurio, diplodocus, estegosaurio, pterodáctilo, mamut, braquiosaurio, megalodón',
      'espinosaurio, anquilosaurio, parasaurolofus, alosaurio, iguanodonte, tigre dientes de sable|dientes de sable|smilodon, plesiosaurio, mosasaurio, ictiosaurio, carnotauro|carnotaurus, argentinosaurio, gigantosaurio|giganotosaurus, dilofosaurio, paquicefalosaurio, compsognathus',
      'trilobites|trilobite, amonite|amonita, dimetrodon, arqueoptérix|archaeopteryx, quetzalcoatlus, terizinosaurio|therizinosaurus, oviraptor, troodon, baryonyx, dunkleosteus, anomalocaris, titanoboa, megaterio, gliptodonte, ceratosaurio, amargasaurio, mapusaurio, celacanto',
    ],
  },
  {
    q: 'Una flor',
    perla: 'rafflesia|flor cadáver',
    z: [
      'rosa, margarita, girasol, tulipán',
      'orquídea, lirio, clavel, jazmín, violeta, lavanda, amapola, azucena, hortensia',
      'dalia, geranio, petunia, gardenia, magnolia, camelia, crisantemo, loto|flor de loto, flor de cerezo|sakura, buganvilla|bugambilia, narciso, begonia, lila, gladiolo, iris, diente de león, nardo, cempasúchil|flor de muerto, azalea, peonía',
      'edelweiss|flor de nieve, protea, ave del paraíso|estrelitzia, nomeolvides, anémona, malva, aster, zinnia, fresia, ranúnculo, alhelí, heliconia, jacinto, flor de pascua|nochebuena|poinsettia, adelfa, dedalera|digital, cantuta, copihue, ceibo, pasionaria',
    ],
  },
  {
    q: 'Algo que hay en un baño',
    perla: 'piedra pómez',
    z: [
      'inodoro|váter|retrete|taza, ducha|regadera, lavabo|lavamanos, espejo, toalla, jabón, papel higiénico',
      'bañera|tina, cepillo de dientes, pasta de dientes|dentífrico, champú, peine, cortina, grifo|llave|canilla, alfombra, secador',
      'bidé|bidet, esponja, cuchilla de afeitar|maquinilla|rastrillo, desodorante, perfume|colonia, hilo dental, botiquín, escobilla, desatascador|destapador|chupón, báscula|balanza, crema, algodón, bastoncillos|hisopos|cotonetes, enjuague bucal, gel, patito de goma, ambientador',
      'toallero, mampara, sifón, cesto de la ropa, pinzas, cortaúñas, lima de uñas, extractor, tapón, cisterna|tanque, rejilla, azulejo, moho, alcachofa',
    ],
  },
  {
    q: 'Algo que tiene alas',
    perla: 'nariz',
    z: [
      'avión, pájaro|ave, mariposa, ángel',
      'abeja, murciélago, mosca, dragón, hada, gallina, águila, pegaso',
      'libélula, polilla, mosquito, avispa, cupido, gárgola, grifo, pingüino, avestruz, pato, cucaracha, hormiga voladora, mariquita, escarabajo',
      'ala delta, avión de papel, querubín, fénix, esfinge, pterosaurio, hipogrifo, edificio, raya, pez volador, hospital, sombrero',
    ],
  },
  {
    q: 'Un nombre para un perro',
    perla: 'Calcetín',
    z: [
      'Max, Firulais, Toby|Tobi, Rocky, Luna, Bobby',
      'Lola, Coco, Nala, Simba, Rex, Lucky, Bruno, Kira, Thor, Chispa, Canela, Manchas, Princesa, Oso, Pelusa',
      'Zeus, Milo, Frida, Bella, Chloe, Bolt, Scooby, Snoopy, Pluto, Lassie, Beethoven, Peluche, Negro|Negrito, Chocolate, Galleta, Pancho, Mía, Kiara, Dana, Bimba, Sultán, Duque, Hachiko',
      'Pulgoso, Cacahuate|Cacahuete|Maní, Tofu, Croqueta, Garbanzo, Napoleón, Sherlock, Chewbacca|Chewie, Gandalf, Frodo, Pepinillo, Wasabi, Kafka, Picasso, Mozart, Paquito, Eustaquio, Fideo',
    ],
  },
  {
    q: 'Algo que se hace con huevos',
    perla: 'pintura al temple|temple',
    z: [
      'tortilla|omelette, huevo frito, pastel|torta|tarta, huevos revueltos',
      'flan, mayonesa, huevo cocido|huevo duro, merengue, galletas, crepas|crepes, bizcocho, panqueques|hot cakes|tortitas',
      'huevo pochado|huevo escalfado, natillas, quiche, rompope|ponche de huevo, tortilla de patatas|tortilla española, suflé|souffle, carbonara, pasta, mousse, huevos rancheros, huevos benedictinos, alioli, rebozado|empanizado, buñuelos',
      'huevo de pascua, cascarones, tamagoyaki, shakshuka, frittata, leche asada, tocino de cielo, yemas de santa teresa, huevos a la flamenca, tempura, mascarilla',
    ],
  },
  {
    q: 'Algo que se puede romper',
    perla: 'barrera del sonido',
    z: [
      'vaso, plato, corazón, espejo, ventana|vidrio|cristal',
      'hueso, teléfono|móvil|celular, huevo, promesa, récord, jarrón, botella, lápiz',
      'silencio, hielo, contrato, dieta, ola, pantalla, uña, cuerda, reloj, gafas|lentes, piñata, nuez, cadena, regla',
      'hechizo|maleficio|embrujo, empate, tensión, racha, cascarón, techo de cristal, monotonía, rutina, protocolo, alcancía|hucha|chanchito, cuarta pared',
    ],
  },
  {
    q: 'Un personaje de cuento infantil',
    perla: 'Piel de Asno',
    z: [
      'Caperucita Roja|Caperucita, Cenicienta, Blancanieves, Pinocho',
      'Lobo Feroz|lobo, Bella Durmiente|Aurora, Peter Pan, Ricitos de Oro, Hansel, Gretel, Rapunzel, Sirenita|Ariel, Patito Feo, Tres Cerditos, Gato con Botas, Aladino',
      'Pulgarcito, Campanilla|Tinkerbell, Capitán Garfio|Garfio, Alicia, Sombrerero Loco, Conejo Blanco, Bella, Bestia, Genio, Hada Madrina, Rumpelstiltskin, Jack, Príncipe Rana|Rana, Soldadito de Plomo, Juan Sin Miedo, Alí Babá, Reina de las Nieves, Gigante, Bruja',
      'Barba Azul, Flautista de Hamelín, Gato de Cheshire, Geppetto|Gepetto, Pepito Grillo, Siete Cabritillos, Sastrecillo Valiente, Ratoncito Pérez, Princesa y el Guisante, Vendedora de Fósforos|Cerillera, Pulgarcita, Baba Yaga, Principito, Momo, Dorothy, Hombre de Hojalata, Espantapájaros',
    ],
  },
  {
    q: 'Algo que da miedo',
    perla: 'talasofobia|miedo al mar profundo',
    z: [
      'fantasma, araña, oscuridad, monstruo, muerte',
      'serpiente, payaso, tiburón, zombi, bruja, vampiro, altura|alturas, ladrón, cucaracha, tormenta',
      'rayo, pesadilla, soledad, examen, dentista, sangre, aguja|inyección, mar, abismo, cementerio, muñeca, terremoto, fuego, demonio, coco|hombre del saco, rata, murciélago, avión',
      'claustrofobia, vacío, futuro, espejo, sótano, tsunami, fracaso, hablar en público, llorona|la llorona, chupacabras, pantano, calamar gigante, kraken, olvido, factura, lunes',
    ],
  },
  {
    q: 'Una herramienta',
    perla: 'berbiquí',
    z: [
      'martillo, destornillador|desarmador, llave inglesa|llave, alicates|pinzas, sierra',
      'taladro, clavo, tornillo, cinta métrica|metro|flexómetro, pala, serrucho, tijeras, nivel, lima',
      'rastrillo, hacha, cincel, lija, soldador, llave allen, tenaza, gato, carretilla, azada, pico, escalera, brocha, pincel, cúter|cutter, sargento, grapadora|engrapadora, pistola de silicona',
      'escuadra, plomada, gubia, formón, buril, punzón, escoplo, garlopa, cepillo de carpintero, llana, paleta, machete, guadaña, hoz, yunque, fuelle, remachadora, multímetro, pie de rey|calibre, polea, palanca, cizalla',
    ],
  },
  {
    q: 'Algo que tiene muchas patas',
    perla: 'illacme|illacme plenipes',
    z: [
      'ciempiés, araña, pulpo',
      'milpiés, cangrejo, cucaracha, hormiga, insecto, escorpión|alacrán, langosta, oruga, mesa',
      'calamar, estrella de mar, camarón, mosca, escarabajo, cochinilla|bicho bola, garrapata, chinche, saltamontes, ácaro, silla, cama, piano, banco',
      'tardígrado|oso de agua, peripato|gusano aterciopelado, isópodo, centolla, cangrejo araña, ofiura, tarántula, opilión, escolopendra, taburete, cangrejo de cocotero',
    ],
  },
  {
    q: 'Algo frío',
    perla: 'venganza',
    z: [
      'hielo, nieve, helado, invierno, nevera|refrigerador|heladera',
      'polo norte|polo sur, antártida, agua, cubito de hielo|cubito, congelador, granizo, viento, pingüino, refresco|soda, cerveza',
      'iceberg, glaciar, escarcha, iglú, montaña, granizado|raspado, oso polar, muñeco de nieve, hielo seco, aire acondicionado, ducha fría, metal, Siberia, Alaska, Groenlandia, ventisca, noche',
      'nitrógeno líquido, cero absoluto, espacio, Plutón, criogenia, permafrost, tundra, carámbano, hielo negro, cadáver, fosa abisal, corazón',
    ],
  },
  {
    q: 'Una palabra que empieza por Z',
    perla: 'zozobra',
    z: [
      'zapato, zorro, zanahoria, zumo',
      'zapatilla, zona, zoológico|zoo, zafiro, zigzag, zarza, zombi, zurdo',
      'zarpa, zodiaco, zueco, zinc, zócalo, zanja, zancudo, zapallo, zarzuela, zarigüeya, zancada, zepelín, zeta, zumbido, zorrillo',
      'zahorí, zascandil, zafarrancho, zalamero, zaguán, zigurat, zampoña, zurrón, zenit, zoquete, zafra, zarabanda, zulú, zircón, zorzal, zángano, zéjel',
    ],
  },
  {
    q: 'Algo que brilla',
    perla: 'noctiluca',
    z: [
      'sol, estrella, oro, diamante, luz',
      'luna, bombilla|foco, linterna, purpurina|brillantina|escarcha, joya, espejo, luciérnaga, plata, fuego, rayo',
      'ojos, metal, faro, vela, neón, cristal, agua, lámpara, pantalla, cometa, relámpago, zapatos, dientes, lentejuelas, glitter, perla',
      'aurora boreal, bioluminiscencia, plancton, medusa, pez linterna, rape, calva, fósforo, uranio, kriptonita, hongo, lava, piedra luna, halo, sable de luz|espada láser',
    ],
  },
];
