import random
import time

# --- Definición de Cartas y Baraja ---
PALOS = ["Oros", "Copas", "Espadas", "Bastos"]
VALORES_NUMERICOS = {
    "As": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "Sota": 10, "Caballo": 11, "Rey": 12
}
NOMBRES_VALORES = {v: k for k, v in VALORES_NUMERICOS.items()} # Para mostrar Sota, Caballo, Rey
PUNTOS_CARTAS = {
    "As": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "Sota": 10, "Caballo": 10, "Rey": 10
}

LIMITE_PUNTOS_PARTIDA = -100 # El juego termina si alguien llega a -100 o más
PUNTOS_CHINCHON = -25
PUNTOS_CERRAR_CON_CERO = -10
MAX_PUNTOS_PARA_CERRAR = 5

class Carta:
    def __init__(self, valor_num, palo):
        self.valor_num = valor_num # 1 (As) a 7, 10 (Sota), 11 (Caballo), 12 (Rey)
        self.palo = palo
        self.nombre_valor = NOMBRES_VALORES[valor_num]
        self.puntos = PUNTOS_CARTAS[self.nombre_valor]

    def __str__(self):
        return f"{self.nombre_valor} de {self.palo}"

    def __repr__(self):
        return f"Carta({self.nombre_valor}, {self.palo})"

    def __lt__(self, other): # Para ordenar
        if self.palo == other.palo:
            return self.valor_num < other.valor_num
        return self.palo < other.palo

def crear_baraja():
    baraja = []
    for palo in PALOS:
        for valor_num in VALORES_NUMERICOS.values():
            baraja.append(Carta(valor_num, palo))
    random.shuffle(baraja)
    return baraja

# --- Lógica de Combinaciones ---
def obtener_combinaciones_posibles(mano):
    """Encuentra todas las escaleras y grupos posibles en una mano."""
    combinaciones = []
    mano_ordenada = sorted(mano, key=lambda c: (c.palo, c.valor_num))

    # Buscar Escaleras
    for i in range(len(mano_ordenada)):
        for j in range(i + 1, len(mano_ordenada)):
            for k in range(j + 1, len(mano_ordenada)):
                # Escaleras de 3
                if mano_ordenada[i].palo == mano_ordenada[j].palo == mano_ordenada[k].palo and \
                   mano_ordenada[i].valor_num + 1 == mano_ordenada[j].valor_num and \
                   mano_ordenada[j].valor_num + 1 == mano_ordenada[k].valor_num:
                    escalera = [mano_ordenada[i], mano_ordenada[j], mano_ordenada[k]]
                    combinaciones.append(escalera)
                    # Intentar extender a 4, 5, 6, 7
                    for l_idx in range(k + 1, len(mano_ordenada)):
                        if mano_ordenada[l_idx].palo == escalera[-1].palo and \
                           mano_ordenada[l_idx].valor_num == escalera[-1].valor_num + 1:
                            escalera_extendida = escalera + [mano_ordenada[l_idx]]
                            combinaciones.append(list(escalera_extendida)) # Crear nueva lista
                            escalera = escalera_extendida # Actualizar para seguir extendiendo
                        # No se puede seguir extendiendo esta escalera particular

    # Buscar Grupos (Tríos y Cuartetos)
    cartas_por_valor = {}
    for carta in mano:
        if carta.valor_num not in cartas_por_valor:
            cartas_por_valor[carta.valor_num] = []
        cartas_por_valor[carta.valor_num].append(carta)

    for valor, lista_cartas in cartas_por_valor.items():
        if len(lista_cartas) >= 3:
            combinaciones.append(lista_cartas[:3]) # Trío
        if len(lista_cartas) == 4:
            combinaciones.append(list(lista_cartas)) # Cuarteto (además del trío)

    # Eliminar duplicados exactos de combinaciones (si una escalera de 4 contiene una de 3)
    # y priorizar las más largas
    combinaciones_unicas = []
    # Ordenar por longitud descendente para priorizar las más largas
    combinaciones.sort(key=len, reverse=True)
    for comb in combinaciones:
        es_subconjunto = False
        for unica_comb in combinaciones_unicas:
            if all(c in unica_comb for c in comb):
                es_subconjunto = True
                break
        if not es_subconjunto:
            combinaciones_unicas.append(comb)
    return combinaciones_unicas


def evaluar_mano(mano_original):
    """
    Intenta encontrar la mejor forma de ligar cartas para minimizar puntos sueltos.
    Retorna (cartas_ligadas, cartas_sueltas, puntos_sueltos)
    """
    if not mano_original:
        return [], [], 0

    mejor_config = {
        "ligadas": [],
        "sueltas": list(mano_original), # Copia
        "puntos_sueltos": sum(c.puntos for c in mano_original)
    }

    # Esta es una heurística. Una solución óptima es más compleja (problema de set cover).
    # Iteramos sobre todas las posibles combinaciones y tratamos de construir un conjunto no solapado.
    from itertools import permutations

    # Intentaremos con un enfoque más simple y directo:
    # 1. Encontrar todas las combinaciones posibles.
    # 2. Intentar seleccionar un conjunto de ellas que no se solapen y cubran la mayor cantidad de cartas.
    
    todas_las_combinaciones = obtener_combinaciones_posibles(list(mano_original)) # Usar copia

    # Función recursiva para encontrar la mejor combinación de ligues
    # (Esta parte puede ser compleja, vamos a simplificarla por ahora)
    # Para esta versión, nos enfocaremos en si SE PUEDE CERRAR.
    # La evaluación final de puntos será más directa.

    # Simplificación para la lógica de cierre:
    # Encontrar un conjunto de combinaciones que deje la menor cantidad de puntos.
    # Usaremos una estrategia "greedy" que puede no ser óptima pero es funcional.
    
    mano_restante = list(mano_original) # Copia
    cartas_ligadas_final = []
    
    # Priorizar combinaciones más largas
    todas_las_combinaciones.sort(key=len, reverse=True)

    for comb in todas_las_combinaciones:
        # Verificar si esta combinación se puede formar con las cartas restantes
        posible_formar = True
        cartas_temp_para_comb = []
        mano_restante_temp = list(mano_restante) # Copia para esta iteración

        for carta_comb in comb:
            encontrada = False
            for i, carta_mano in enumerate(mano_restante_temp):
                if carta_mano.valor_num == carta_comb.valor_num and carta_mano.palo == carta_comb.palo:
                    cartas_temp_para_comb.append(mano_restante_temp.pop(i))
                    encontrada = True
                    break
            if not encontrada:
                posible_formar = False
                break
        
        if posible_formar:
            cartas_ligadas_final.extend(cartas_temp_para_comb)
            mano_restante = mano_restante_temp # Actualizar mano restante

    cartas_sueltas_final = mano_restante
    puntos_sueltos_final = sum(c.puntos for c in cartas_sueltas_final)

    return cartas_ligadas_final, cartas_sueltas_final, puntos_sueltos_final

def es_chin_chon(mano):
    if len(mano) != 7:
        return False
    mano.sort() # Ordena por palo y luego por valor
    palo_comun = mano[0].palo
    for i in range(1, 7):
        if mano[i].palo != palo_comun or mano[i].valor_num != mano[i-1].valor_num + 1:
            return False
    return True

# --- Funciones de Juego ---
def mostrar_mano(mano, nombre_jugador):
    print(f"\n--- Mano de {nombre_jugador} ---")
    if not mano:
        print("Mano vacía.")
        return
    for i, carta in enumerate(mano):
        print(f"{i+1}. {carta}")
    print("--------------------")

def robar_del_mazo(mazo):
    if not mazo:
        return None # Mazo vacío
    return mazo.pop(0)

def robar_del_pozo(pozo):
    if not pozo:
        return None # Pozo vacío
    return pozo.pop() # La última carta descartada es la de arriba

def cpu_elige_descarte(mano_cpu):
    """CPU descarta la carta que menos le sirva o la de más puntos sin combinar."""
    _, cartas_sueltas, _ = evaluar_mano(mano_cpu)

    if cartas_sueltas:
        # Descartar la carta suelta de mayor puntuación
        cartas_sueltas.sort(key=lambda c: c.puntos, reverse=True)
        carta_a_descartar = cartas_sueltas[0]
    else:
        # Si todas están ligadas (raro, o ChinChon), o para romper un ligue
        # Aquí se podría tener una lógica más compleja para romper el peor ligue
        # Por simplicidad, descarta la de mayor puntuación general.
        mano_cpu.sort(key=lambda c: c.puntos, reverse=True)
        carta_a_descartar = mano_cpu[0]

    # Asegurarse de que la carta a descartar está en la mano y removerla
    idx_descarte = -1
    for i, c in enumerate(mano_cpu):
        # Comparar por valor y palo para asegurar unicidad si hay cartas del mismo valor
        if c.valor_num == carta_a_descartar.valor_num and c.palo == carta_a_descartar.palo:
            idx_descarte = i
            break
    
    if idx_descarte != -1:
        return mano_cpu.pop(idx_descarte)
    else: # Fallback por si algo sale mal
        return mano_cpu.pop(random.randrange(len(mano_cpu)))


def cpu_decision_robar(mano_cpu, carta_pozo, mazo_robo):
    """CPU decide si robar del pozo o del mazo."""
    if not carta_pozo: # Pozo vacío al inicio de la ronda
        return robar_del_mazo(mazo_robo), "mazo"

    # Evaluar si la carta del pozo mejora la mano
    # 1. ¿Forma ChinChon?
    if len(mano_cpu) == 6: # Si la toma, tendrá 7
        temp_mano_con_pozo = mano_cpu + [carta_pozo]
        if es_chin_chon(temp_mano_con_pozo):
            return carta_pozo, "pozo"

    # 2. ¿Permite cerrar o reduce significativamente los puntos?
    _, _, puntos_actuales = evaluar_mano(mano_cpu)
    
    mano_con_pozo = mano_cpu + [carta_pozo]
    # Evaluar mano_con_pozo descartando la "peor" carta de las 8
    mejor_puntos_con_pozo = float('inf')
    for i in range(len(mano_con_pozo)):
        temp_mano_eval = mano_con_pozo[:i] + mano_con_pozo[i+1:]
        _, _, puntos_temp = evaluar_mano(temp_mano_eval)
        if puntos_temp < mejor_puntos_con_pozo:
            mejor_puntos_con_pozo = puntos_temp
    
    # Heurística simple: si reduce puntos en más de X o permite cerrar
    if mejor_puntos_con_pozo < puntos_actuales - 3 or mejor_puntos_con_pozo <= MAX_PUNTOS_PARA_CERRAR:
         print("CPU considera que la carta del pozo es buena.")
         return carta_pozo, "pozo"

    # Si no, roba del mazo
    print("CPU roba del mazo.")
    return robar_del_mazo(mazo_robo), "mazo"

# --- Flujo Principal del Juego ---
def jugar_chin_chon():
    puntuacion_jugador = 0
    puntuacion_cpu = 0
    num_ronda = 0

    print("--- ¡Bienvenido al Chin Chón! ---")

    while puntuacion_jugador > LIMITE_PUNTOS_PARTIDA and puntuacion_cpu > LIMITE_PUNTOS_PARTIDA:
        num_ronda += 1
        print(f"\n--- Ronda {num_ronda} ---")
        print(f"Puntuaciones: Jugador {puntuacion_jugador}, CPU {puntuacion_cpu}")

        baraja = crear_baraja()
        mano_jugador = []
        mano_cpu = []
        pozo = []

        for _ in range(7):
            mano_jugador.append(baraja.pop(0))
            mano_cpu.append(baraja.pop(0))

        if baraja: # Asegurarse que la baraja no está vacía
            pozo.append(baraja.pop(0))
        else:
            print("Error: Baraja vacía después de repartir.")
            return


        turno_jugador = True # El jugador empieza
        alguien_cerro = False
        jugador_que_cerro = None
        cerrador_hizo_chinchon = False

        while not alguien_cerro:
            if not baraja and not pozo: # No debería pasar con una baraja de reserva
                print("Empate técnico en la ronda, no hay más cartas.")
                break
            
            if not baraja: # Si el mazo de robo se acaba, se baraja el pozo (menos la última)
                print("El mazo de robo se acabó. Barajando el pozo...")
                if len(pozo) > 1:
                    carta_superior_pozo = pozo.pop()
                    random.shuffle(pozo)
                    baraja = pozo
                    pozo = [carta_superior_pozo]
                else: # No hay suficientes cartas para reponer el mazo
                    print("No hay suficientes cartas en el pozo para reponer el mazo. Ronda en empate.")
                    break


            print("\n--- Pozo ---")
            if pozo:
                print(f"Carta superior: {pozo[-1]}")
            else:
                print("Pozo vacío.")
            print("------------")

            if turno_jugador:
                print("\n*** Turno del Jugador ***")
                mostrar_mano(mano_jugador, "Jugador")

                # 1. Robar
                while True:
                    eleccion_robo = input("¿Robar del (M)azo o del (P)ozo? ").upper()
                    carta_robada = None
                    if eleccion_robo == 'M':
                        if not baraja:
                            print("¡El mazo está vacío! Debes tomar del pozo si hay, o se acaba la ronda.")
                            if not pozo: break # Salir del bucle de turno si no hay opciones
                            continue # Volver a preguntar si solo el mazo está vacío pero pozo no
                        carta_robada = robar_del_mazo(baraja)
                        print(f"Has robado: {carta_robada}")
                        break
                    elif eleccion_robo == 'P':
                        if not pozo:
                            print("¡El pozo está vacío! Debes tomar del mazo.")
                            continue
                        carta_robada = robar_del_pozo(pozo)
                        print(f"Has robado del pozo: {carta_robada}")
                        break
                    else:
                        print("Opción no válida.")
                
                if carta_robada is None and not baraja and not pozo: # Situación de bloqueo
                    break

                mano_jugador.append(carta_robada)
                mostrar_mano(mano_jugador, "Jugador (con carta nueva)")

                # 2. Descartar
                while True:
                    try:
                        idx_descarte = int(input(f"Elige el número de la carta a descartar (1-{len(mano_jugador)}): ")) - 1
                        if 0 <= idx_descarte < len(mano_jugador):
                            carta_descartada = mano_jugador.pop(idx_descarte)
                            pozo.append(carta_descartada)
                            print(f"Has descartado: {carta_descartada}")
                            break
                        else:
                            print("Número fuera de rango.")
                    except ValueError:
                        print("Entrada no válida. Introduce un número.")
                
                # 3. ¿Cerrar?
                if es_chin_chon(mano_jugador):
                    print("¡¡¡CHIN CHÓN!!! ¡Has ganado la ronda!")
                    alguien_cerro = True
                    jugador_que_cerro = "Jugador"
                    cerrador_hizo_chinchon = True
                else:
                    _, _, puntos_sin_ligar_jugador = evaluar_mano(mano_jugador)
                    print(f"Tus puntos sin ligar actuales: {puntos_sin_ligar_jugador}")
                    if puntos_sin_ligar_jugador <= MAX_PUNTOS_PARA_CERRAR:
                        cerrar = input(f"Puedes cerrar con {puntos_sin_ligar_jugador} puntos. ¿Cerrar? (S/N): ").upper()
                        if cerrar == 'S':
                            print("¡Has decidido cerrar la ronda!")
                            alguien_cerro = True
                            jugador_que_cerro = "Jugador"

            else: # Turno CPU
                print("\n*** Turno de la CPU ***")
                time.sleep(1) # Simular pensamiento

                # 1. Robar CPU
                carta_robada_cpu, origen_robo = cpu_decision_robar(list(mano_cpu), pozo[-1] if pozo else None, baraja)
                
                if carta_robada_cpu is None: # No hay cartas para robar
                    print("CPU no puede robar. Ronda en empate.")
                    break

                if origen_robo == "pozo":
                    pozo.pop() # La CPU tomó la carta del pozo
                    print(f"CPU ha robado del pozo: {carta_robada_cpu}")
                else:
                    # baraja ya fue modificada por robar_del_mazo
                    print(f"CPU ha robado del mazo.") # No mostramos la carta para no dar pistas

                mano_cpu.append(carta_robada_cpu)
                # mostrar_mano(mano_cpu, "CPU DEBUG") # Para depurar

                # 2. Descartar CPU
                time.sleep(0.5)
                carta_descartada_cpu = cpu_elige_descarte(mano_cpu) # La función modifica mano_cpu
                pozo.append(carta_descartada_cpu)
                print(f"CPU ha descartado: {carta_descartada_cpu}")
                # mostrar_mano(mano_cpu, "CPU DEBUG Post-Descarte")

                # 3. ¿Cerrar CPU?
                if es_chin_chon(mano_cpu):
                    print("¡¡¡CHIN CHÓN de la CPU!!! La CPU gana la ronda.")
                    alguien_cerro = True
                    jugador_que_cerro = "CPU"
                    cerrador_hizo_chinchon = True
                else:
                    _, _, puntos_sin_ligar_cpu = evaluar_mano(mano_cpu)
                    # La CPU cerrará si tiene pocos puntos, por ejemplo, 2 o menos, para ser más agresiva.
                    if puntos_sin_ligar_cpu <= MAX_PUNTOS_PARA_CERRAR - 2: # Más agresiva
                        print(f"CPU decide cerrar la ronda con {puntos_sin_ligar_cpu} puntos.")
                        alguien_cerro = True
                        jugador_que_cerro = "CPU"
            
            if alguien_cerro: break # Salir del bucle de turnos
            turno_jugador = not turno_jugador # Cambiar turno

        # --- Fin de la Ronda ---
        print("\n--- Fin de la Ronda ---")
        
        ligadas_jugador, sueltas_jugador, puntos_ronda_jugador = evaluar_mano(mano_jugador)
        ligadas_cpu, sueltas_cpu, puntos_ronda_cpu = evaluar_mano(mano_cpu)

        print("\n--- Cartas del Jugador ---")
        print("Ligadas:")
        for carta in ligadas_jugador: print(f"  {carta}")
        print("Sueltas:")
        for carta in sueltas_jugador: print(f"  {carta} ({carta.puntos} pts)")
        print(f"Puntos del Jugador esta ronda: {puntos_ronda_jugador}")

        print("\n--- Cartas de la CPU ---")
        print("Ligadas:")
        for carta in ligadas_cpu: print(f"  {carta}")
        print("Sueltas:")
        for carta in sueltas_cpu: print(f"  {carta} ({carta.puntos} pts)")
        print(f"Puntos de la CPU esta ronda: {puntos_ronda_cpu}")

        if jugador_que_cerro == "Jugador":
            if cerrador_hizo_chinchon:
                puntuacion_jugador += PUNTOS_CHINCHON
                puntuacion_cpu += puntos_ronda_cpu # El otro suma sus puntos normales
            else:
                if puntos_ronda_jugador == 0:
                    puntuacion_jugador += PUNTOS_CERRAR_CON_CERO
                else:
                    puntuacion_jugador += puntos_ronda_jugador
                
                # Penalización si el que cierra tiene más puntos que el otro
                # (Simplificado: si el otro tiene menos puntos que el que cerró y este no es 0)
                if puntos_ronda_cpu < puntos_ronda_jugador and puntos_ronda_jugador > 0:
                     print(f"¡Corte fallido para el Jugador! CPU tenía menos puntos ({puntos_ronda_cpu}).")
                     puntuacion_jugador += 25 # Penalización
                else:
                    puntuacion_cpu += puntos_ronda_cpu

        elif jugador_que_cerro == "CPU":
            if cerrador_hizo_chinchon:
                puntuacion_cpu += PUNTOS_CHINCHON
                puntuacion_jugador += puntos_ronda_jugador
            else:
                if puntos_ronda_cpu == 0:
                    puntuacion_cpu += PUNTOS_CERRAR_CON_CERO
                else:
                    puntuacion_cpu += puntos_ronda_cpu
                
                if puntos_ronda_jugador < puntos_ronda_cpu and puntos_ronda_cpu > 0:
                     print(f"¡Corte fallido para la CPU! Jugador tenía menos puntos ({puntos_ronda_jugador}).")
                     puntuacion_cpu += 25 # Penalización
                else:
                    puntuacion_jugador += puntos_ronda_jugador
        else: # Nadie cerró (ej: se acabaron las cartas)
            puntuacion_jugador += puntos_ronda_jugador
            puntuacion_cpu += puntos_ronda_cpu
            print("Nadie cerró, se suman los puntos de las manos.")


        print(f"\n--- Puntuación Acumulada ---")
        print(f"Jugador: {puntuacion_jugador}")
        print(f"CPU: {puntuacion_cpu}")

        if puntuacion_jugador <= LIMITE_PUNTOS_PARTIDA or puntuacion_cpu <= LIMITE_PUNTOS_PARTIDA:
            break # Salir del bucle de rondas

        input("Presiona Enter para la siguiente ronda...")
    
    # --- Fin de la Partida ---
    print("\n--- ¡Fin de la Partida! ---")
    print(f"Puntuación Final: Jugador {puntuacion_jugador}, CPU {puntuacion_cpu}")
    if puntuacion_jugador < puntuacion_cpu : # Menos puntos (más negativos) es mejor
        if puntuacion_jugador <= LIMITE_PUNTOS_PARTIDA:
             print("¡El Jugador ha superado el límite de puntos primero, la CPU gana!")
        else:
             print("¡Felicidades, Jugador! ¡Has ganado!")
    elif puntuacion_cpu < puntuacion_jugador:
        if puntuacion_cpu <= LIMITE_PUNTOS_PARTIDA:
             print("¡La CPU ha superado el límite de puntos primero, el Jugador gana!")
        else:
             print("¡La CPU ha ganado!")
    else:
        print("¡Es un empate!")

if __name__ == "__main__":
    jugar_chin_chon()