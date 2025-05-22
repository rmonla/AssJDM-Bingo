#!/bin/bash

# Ricardo MONLA (rmonla@)
# v3.5.1 - 260724_1000 (Fix for code block closing)
# Script para exportar archivos de código fuente a un único archivo Markdown.

# --- Variables Globales ---
SELECTED_ROOT_FOLDER=""
declare -a ALL_PROJECT_FILES=() # Lista de todos los archivos encontrados
declare -a ALL_DIRS_IN_PROJECT=() # Lista de todos los directorios encontrados
declare -A SELECTED_STATUS_MAP=() # path_archivo -> 0 o 1 (deseleccionado/seleccionado)
declare -A EXPANDED_DIRS=() # path_directorio -> 1 si está expandido
declare -a FINAL_SELECTED_FILES=()

# --- Funciones Auxiliares ---

map_extension_to_language() {
    local filename="$1"
    local extension="${filename##*.}"
    extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')

    case "$extension" in
        sh|bash|zsh) echo "bash" ;;
        py|pyw) echo "python" ;;
        js|mjs|cjs) echo "javascript" ;;
        ts|tsx) echo "typescript" ;;
        java) echo "java" ;;
        c|h|cc|cpp|hpp|cxx|hxx) echo "cpp" ;;
        cs) echo "csharp" ;;
        go) echo "go" ;;
        rb) echo "ruby" ;;
        php) echo "php" ;;
        html|htm) echo "html" ;;
        css) echo "css" ;;
        scss|sass) echo "scss" ;;
        json) echo "json" ;;
        xml) echo "xml" ;;
        yml|yaml) echo "yaml" ;;
        md|markdown) echo "markdown" ;;
        sql) echo "sql" ;;
        swift) echo "swift" ;;
        kt|kts) echo "kotlin" ;;
        rs) echo "rust" ;;
        *) echo "" ;; # Devuelve cadena vacía para que ``` sea un bloque de código genérico
    esac
}

# Procesa la selección/deselección de archivos, mostrando una vista de árbol interactiva.
process_file_selection() {
    local original_pwd_ps
    original_pwd_ps=$(pwd)
    
    cd "$SELECTED_ROOT_FOLDER" || { echo "Error: No se pudo acceder a la carpeta $SELECTED_ROOT_FOLDER"; exit 1; }

    ALL_PROJECT_FILES=() 
    ALL_DIRS_IN_PROJECT=()
    SELECTED_STATUS_MAP=() 
    EXPANDED_DIRS=()

    # Obtener todos los archivos y directorios relativos a SELECTED_ROOT_FOLDER
    # Excluir .git y otros directorios/archivos ocultos
    local all_paths_raw=()
    # Usar find con -print para asegurar que cada path está en una línea nueva, luego leer con mapfile.
    # -print0 y xargs -0 es más robusto para nombres con espacios/newlines, pero para la lógica actual -print es suficiente
    # y más simple si no esperamos nombres de archivo patológicos.
    # Revisión: Volver a -print0 para robustez.
    mapfile -t all_paths_raw < <(find . -not \( -path '*/.*' -o -name '.*' \) -print0 | sort -z | xargs -0 -n1 echo )


    if [[ ${#all_paths_raw[@]} -eq 0 || ( ${#all_paths_raw[@]} -eq 1 && "${all_paths_raw[0]}" == "./." ) ]]; then
        echo "No se encontraron archivos o directorios significativos (excluyendo ocultos) en '$SELECTED_ROOT_FOLDER'."
        cd "$original_pwd_ps"
        return 1
    fi
    
    for path_raw in "${all_paths_raw[@]}"; do
        local rel_path="${path_raw#./}" 
        if [[ "$rel_path" == "." ]]; then continue; fi 

        if [[ -d "$rel_path" ]]; then
            ALL_DIRS_IN_PROJECT+=("$rel_path")
        elif [[ -f "$rel_path" ]]; then
            ALL_PROJECT_FILES+=("$rel_path")
            SELECTED_STATUS_MAP["$rel_path"]=0 
        fi
    done

    if [[ ${#ALL_PROJECT_FILES[@]} -eq 0 && ${#ALL_DIRS_IN_PROJECT[@]} -eq 0 ]]; then
        echo "No se encontraron archivos o directorios (excluyendo ocultos y el propio raíz '.') en '$SELECTED_ROOT_FOLDER'."
        cd "$original_pwd_ps"
        return 1
    fi

    declare -A PARENT_TO_CHILDREN_MAP
    PARENT_TO_CHILDREN_MAP["."]=""; 
    for dir_path in "${ALL_DIRS_IN_PROJECT[@]}"; do
        PARENT_TO_CHILDREN_MAP["$dir_path"]=""
    done

    for file_path in "${ALL_PROJECT_FILES[@]}"; do
        parent_dir=$(dirname "$file_path")
        entry_basename=$(basename "$file_path")
        PARENT_TO_CHILDREN_MAP["$parent_dir"]+="$entry_basename:f "
    done

    for dir_path in "${ALL_DIRS_IN_PROJECT[@]}"; do
        parent_dir=$(dirname "$dir_path")
        entry_basename=$(basename "$dir_path")
        PARENT_TO_CHILDREN_MAP["$parent_dir"]+="$entry_basename:d "
    done
    
    for key in "${!PARENT_TO_CHILDREN_MAP[@]}"; do
        local unsorted_children_str="${PARENT_TO_CHILDREN_MAP[$key]}"
        local sorted_children_array=()
        if [[ -n "$unsorted_children_str" ]]; then 
            mapfile -t sorted_children_array < <(echo "$unsorted_children_str" | tr ' ' '\n' | grep . | sort)
        fi
        PARENT_TO_CHILDREN_MAP["$key"]="${sorted_children_array[*]}"
    done

    local item_counter 
    declare -a current_display_paths_ordered 
    declare -a current_display_lines_formatted 

    build_recursive_display_list() {
        local current_dir="$1" 
        local base_indent="$2"

        local children_str="${PARENT_TO_CHILDREN_MAP[$current_dir]}"
        if [[ -z "$children_str" ]]; then return; fi
        local -a children_array=($children_str) 
        
        local num_entries=${#children_array[@]}
        for i in "${!children_array[@]}"; do
            local child_entry="${children_array[$i]}" 
            local entry_name="${child_entry%:*}"
            local entry_type="${child_entry##*:}"
            
            local entry_path
            if [[ "$current_dir" == "." ]]; then
                entry_path="$entry_name"
            else
                entry_path="$current_dir/$entry_name"
            fi

            local is_last_entry=$(( i == num_entries - 1 ))
            local branch_char="├──"
            [[ "$is_last_entry" -eq 1 ]] && branch_char="└──"

            ((item_counter++))
            current_display_paths_ordered+=("$entry_path")

            local display_line_prefix="${base_indent}${branch_char}"

            if [[ "$entry_type" == "d" ]]; then 
                local dir_status_char="[+]"
                [[ -n "${EXPANDED_DIRS[$entry_path]}" ]] && dir_status_char="[-]"
                current_display_lines_formatted+=("$(printf "%3d. %s %s 📁 %s/" "$item_counter" "$dir_status_char" "$display_line_prefix" "$entry_name")")
                
                if [[ -n "${EXPANDED_DIRS[$entry_path]}" ]]; then
                    local next_indent_base="$base_indent"
                    [[ "$is_last_entry" -eq 1 ]] && next_indent_base+="    " || next_indent_base+="│   "
                    build_recursive_display_list "$entry_path" "$next_indent_base"
                fi
            elif [[ "$entry_type" == "f" ]]; then 
                local file_status_char="[ ]"
                [[ "${SELECTED_STATUS_MAP[$entry_path]}" -eq 1 ]] && file_status_char="[x]"
                current_display_lines_formatted+=("$(printf "%3d. %s %s 📄 %s" "$item_counter" "$file_status_char" "$display_line_prefix" "$entry_name")")
            fi
        done
    }

    while true; do
        clear
        echo "Seleccione: (<Número>, 'a' todos, 'n' ninguno, 'e' expandir, 'c' colapsar, 'f' finalizar, 'q' salir)"
        echo "Directorio raíz: $SELECTED_ROOT_FOLDER"
        echo "--------------------------------------------------------------------------------"

        item_counter=0
        current_display_paths_ordered=()
        current_display_lines_formatted=()

        build_recursive_display_list "." "" 

        if [[ ${#current_display_lines_formatted[@]} -eq 0 ]]; then
            if [[ ${#ALL_PROJECT_FILES[@]} -eq 0 && ${#ALL_DIRS_IN_PROJECT[@]} -eq 0 ]]; then
                echo "No hay archivos o directorios para mostrar en $SELECTED_ROOT_FOLDER."
            else
                echo "(Directorio raíz vacío o todos los subdirectorios están colapsados)"
            fi
        else
            for line in "${current_display_lines_formatted[@]}"; do
                echo "$line"
            done
        fi
        echo "--------------------------------------------------------------------------------"
        read -r -p "Opción: " choice

        if [[ "$choice" =~ ^[0-9]+$ ]]; then
            if (( choice >= 1 && choice <= ${#current_display_paths_ordered[@]} )); then
                local selected_idx=$((choice - 1))
                local target_path="${current_display_paths_ordered[$selected_idx]}"
                
                if [[ -v SELECTED_STATUS_MAP["$target_path"] ]]; then # Es un archivo (solo los archivos están en SELECTED_STATUS_MAP)
                    SELECTED_STATUS_MAP["$target_path"]=$((1 - SELECTED_STATUS_MAP["$target_path"]))
                elif ( printf '%s\n' "${ALL_DIRS_IN_PROJECT[@]}" | grep -q -x "$target_path" ) || [[ -d "$target_path" ]]; then # Es un directorio
                    if [[ -n "${EXPANDED_DIRS[$target_path]}" ]]; then
                        unset EXPANDED_DIRS["$target_path"]
                    else
                        EXPANDED_DIRS["$target_path"]=1
                    fi
                else
                    echo "Error: No se pudo determinar el tipo de '$target_path'." ; sleep 1
                fi
            else
                echo "Número fuera de rango." ; sleep 1
            fi
        else
            case "$choice" in
                a|A) for f_path_key in "${!SELECTED_STATUS_MAP[@]}"; do SELECTED_STATUS_MAP["$f_path_key"]=1; done; echo "Todos los archivos seleccionados."; sleep 0.5;;
                n|N) for f_path_key in "${!SELECTED_STATUS_MAP[@]}"; do SELECTED_STATUS_MAP["$f_path_key"]=0; done; echo "Ningún archivo seleccionado."; sleep 0.5;;
                e|E) for d_path in "${ALL_DIRS_IN_PROJECT[@]}"; do EXPANDED_DIRS["$d_path"]=1; done; echo "Todos los directorios expandidos."; sleep 0.5;;
                c|C) EXPANDED_DIRS=(); echo "Todos los directorios colapsados."; sleep 0.5;;
                f|F)
                    FINAL_SELECTED_FILES=()
                    for f_path in "${!SELECTED_STATUS_MAP[@]}"; do
                        if [[ "${SELECTED_STATUS_MAP[$f_path]}" -eq 1 ]]; then
                            FINAL_SELECTED_FILES+=("$f_path")
                        fi
                    done
                    mapfile -t FINAL_SELECTED_FILES < <(printf "%s\n" "${FINAL_SELECTED_FILES[@]}" | sort)

                    if [[ ${#FINAL_SELECTED_FILES[@]} -eq 0 ]]; then
                        echo "No se seleccionó ningún archivo. ¿Continuar sin archivos? (s/N)"; read -r -n1 cnf; echo
                        if ! [[ "$cnf" == "s" || "$cnf" == "S" ]]; then continue; fi
                    fi
                    echo "Selección finalizada."; cd "$original_pwd_ps"; return 0;;
                q|Q) echo "¿Salir del script? (s/N)"; read -r -n1 cnf; echo; if [[ "$cnf" == "s" || "$cnf" == "S" ]]; then cd "$original_pwd_ps"; exit 0; fi;;
                *) echo "Opción inválida."; sleep 1;;
            esac
        fi
    done 
    cd "$original_pwd_ps"
    return 1 
}


generate_directory_tree_markdown() {
    local output_file="$1"
        
    echo "Generando estructura de árbol..." >> "$output_file"
    echo "\`\`\`text" >> "$output_file"

    if [[ ${#FINAL_SELECTED_FILES[@]} -eq 0 ]]; then
        echo "(Ningún archivo seleccionado para el árbol)" >> "$output_file"
    elif command -v tree &> /dev/null; then
        local temp_tree_dir
        temp_tree_dir=$(mktemp -d)
        ( # Subshell para aislar el cd y el trap
            cd "$SELECTED_ROOT_FOLDER" || exit 1 
            trap 'rm -rf "$temp_tree_dir"' EXIT HUP INT QUIT TERM

            for file_rel_path in "${FINAL_SELECTED_FILES[@]}"; do
                mkdir -p "$temp_tree_dir/$(dirname "$file_rel_path")"
                # Crear un archivo vacío, no necesitamos copiar contenido para el árbol
                touch "$temp_tree_dir/$file_rel_path" 
            done
            
            # Ejecutar tree desde dentro del directorio temporal para obtener rutas relativas limpias
            # sed '1d' elimina la primera línea del output de tree (que es '.')
            (cd "$temp_tree_dir" && tree -L 10 --noreport --charset=UTF-8 .) | sed '1d' >> "$output_file" 
            
            # El trap se encargará de rm -rf "$temp_tree_dir"
        ) # Fin del subshell
    else
        echo "Comando 'tree' no encontrado. Mostrando simulación de árbol." >> "$output_file"
        # La simulación de árbol se mantiene como fallback
        declare -A printed_dirs_md
        local last_printed_dir_components_str_md=""
        local sorted_final_files_md=("${FINAL_SELECTED_FILES[@]}") # Ya están ordenados

        for i in "${!sorted_final_files_md[@]}"; do
            local file_rel_path="${sorted_final_files_md[$i]}"
            local current_file_dir_md
            current_file_dir_md=$(dirname "$file_rel_path")
            [[ "$current_file_dir_md" == "." ]] && current_file_dir_md=""

            local base_name_md
            base_name_md=$(basename "$file_rel_path")

            if [[ "$current_file_dir_md" != "$last_printed_dir_components_str_md" ]]; then
                IFS='/' read -r -a current_dir_parts_md <<< "$current_file_dir_md"
                if [[ "$current_file_dir_md" == "" ]]; then current_dir_parts_md=(); fi

                local depth_md=0
                for depth_md in $(seq 0 $((${#current_dir_parts_md[@]} -1 )) ); do
                    local partial_path_to_check_md=""
                    for k_md in $(seq 0 "$depth_md"); do
                        partial_path_to_check_md+="${current_dir_parts_md[$k_md]}"
                        if [[ $k_md -lt $depth_md ]]; then partial_path_to_check_md+="/"; fi
                    done

                    if [[ -z "${printed_dirs_md[$partial_path_to_check_md]}" ]]; then
                        local header_indent_md=""
                        for _ in $(seq 1 "$depth_md"); do header_indent_md+="│   "; done
                        echo "${header_indent_md}├── ${current_dir_parts_md[$depth_md]}/" >> "$output_file"
                        printed_dirs_md["$partial_path_to_check_md"]=1
                    fi
                done
                last_printed_dir_components_str_md="$current_file_dir_md"
            fi

            local file_indent_str_md=""
            IFS='/' read -r -a dir_parts_for_file_md <<< "$current_file_dir_md"
            if [[ "$current_file_dir_md" == "" ]]; then dir_parts_for_file_md=(); fi
            for _ in $(seq 1 "${#dir_parts_for_file_md[@]}"); do file_indent_str_md+="│   "; done
            
            local branch_char_md="├──"
            # Lógica para determinar si es el último elemento en este nivel para usar └──
            # Esta simulación puede no ser perfecta para └── en directorios, se enfoca en archivos.
            local is_last_in_dir=true
            if [[ $((i + 1)) -lt ${#sorted_final_files_md[@]} ]]; then
                local next_file_dir_simulated
                next_file_dir_simulated=$(dirname "${sorted_final_files_md[$((i + 1))]}")
                [[ "$next_file_dir_simulated" == "." ]] && next_file_dir_simulated=""
                if [[ "$next_file_dir_simulated" == "$current_file_dir_md" ]]; then
                    is_last_in_dir=false
                fi
            fi
            if $is_last_in_dir; then
                 branch_char_md="└──"
            fi

            echo "${file_indent_str_md}${branch_char_md} ${base_name_md}" >> "$output_file"
        done
    fi
    echo "" >> "$output_file" # Línea en blanco después del árbol
    echo "\`\`\`" >> "$output_file"
    echo "" >> "$output_file" # Espacio después del bloque de código del árbol
}

export_content_to_markdown() {
    local output_filename
    local default_name="export_$(basename "$SELECTED_ROOT_FOLDER" | sed 's/[^a-zA-Z0-9_-]/_/g')_$(date +%Y%m%d_%H%M).md"
    
    read -r -p "Ingrese el nombre del archivo Markdown de salida (default: ${default_name}): " output_filename
    output_filename="${output_filename:-$default_name}"

    # Asegurar que la ruta es absoluta o relativa al CWD del script al inicio
    if [[ "$output_filename" != /* && "$output_filename" != ~* ]]; then
        output_filename="$(pwd)/$output_filename" 
    elif [[ "$output_filename" == ~* ]]; then
        output_filename="${HOME}${output_filename#\~}"
    fi
    
    local output_dir
    output_dir=$(dirname "$output_filename")
    if [[ ! -d "$output_dir" ]]; then
        mkdir -p "$output_dir" || { echo "Error: No se pudo crear el directorio de salida '$output_dir'."; return 1; }
    fi

    echo "Generando archivo Markdown en: $output_filename"

    echo "# Exportación de Código: $(basename "$SELECTED_ROOT_FOLDER")" > "$output_filename"
    echo "Ruta raíz del proyecto: \`$SELECTED_ROOT_FOLDER\`" >> "$output_filename"
    echo "Fecha de exportación: $(date)" >> "$output_filename"
    echo "" >> "$output_filename"

    echo "## Estructura de Archivos (Árbol)" >> "$output_filename"
    generate_directory_tree_markdown "$output_filename" # Ya añade sus propios newlines finales

    echo "## Lista de Archivos Incluidos" >> "$output_filename"
    if [[ ${#FINAL_SELECTED_FILES[@]} -gt 0 ]]; then
        for file_rel_path in "${FINAL_SELECTED_FILES[@]}"; do
            echo "* \`$file_rel_path\`" >> "$output_filename"
        done
    else
        echo "Ningún archivo fue seleccionado para incluir." >> "$output_filename"
    fi
    echo "" >> "$output_filename"

    echo "## Contenido de los Archivos" >> "$output_filename"
    if [[ ${#FINAL_SELECTED_FILES[@]} -gt 0 ]]; then
        local original_pwd_export
        original_pwd_export=$(pwd)
        cd "$SELECTED_ROOT_FOLDER" || { echo "Error: No se pudo acceder a $SELECTED_ROOT_FOLDER"; exit 1; }

        for file_rel_path in "${FINAL_SELECTED_FILES[@]}"; do
            echo "### \`$file_rel_path\`" >> "$output_filename"
            local lang
            lang=$(map_extension_to_language "$file_rel_path")
            echo "\`\`\`${lang}" >> "$output_filename"
            
            if [[ -f "$file_rel_path" && -r "$file_rel_path" ]]; then
                cat "$file_rel_path" >> "$output_filename"
                # SOLUCIÓN: Asegurar que hay una nueva línea después del contenido del archivo
                # y antes de la secuencia de cierre del bloque de código.
                # Si cat ya imprimió una nueva línea, esto añadirá una línea vacía, lo cual es inofensivo.
                # Si cat NO imprimió una nueva línea, esto añade la nueva línea necesaria.
                echo >> "$output_filename" 
            else
                echo "Error: No se pudo leer '$file_rel_path'" >> "$output_filename"
                # También asegurar nueva línea aquí para que el ``` de cierre esté en su propia línea.
                echo >> "$output_filename"
            fi
            
            echo "\`\`\`" >> "$output_filename" # Esta línea ahora siempre estará precedida por una nueva línea.
            echo "" >> "$output_filename" # Para una línea en blanco después del bloque de código.
        done
        cd "$original_pwd_export"
    else
        echo "No hay contenido de archivos para exportar." >> "$output_filename"
    fi

    echo "----------------------------------------"
    echo "¡Exportación completada!"
    echo "Archivo Markdown generado: $output_filename"
    echo "----------------------------------------"
    return 0
}

main() {
    # Guardar el directorio desde donde se ejecuta el script puede ser útil si el script
    # necesita acceder a recursos relativos a su propia ubicación, aunque este no lo hace.
    # local script_initial_dir
    # script_initial_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    
    local initial_cwd 
    initial_cwd=$(pwd) # Directorio de trabajo actual al iniciar

    echo "===== Herramienta de Exportación de Código a Markdown ====="
    
    # Preguntar al usuario por la carpeta raíz o usar la actual
    read -r -e -p "Ingrese la ruta a la carpeta raíz del proyecto (default: $(pwd)): " user_root_folder
    SELECTED_ROOT_FOLDER="${user_root_folder:-$(pwd)}"

    # Expandir ~ si el usuario lo ingresa
    SELECTED_ROOT_FOLDER="${SELECTED_ROOT_FOLDER/#\~/$HOME}"

    if [[ ! -d "$SELECTED_ROOT_FOLDER" ]]; then
        echo "Error: El directorio '$SELECTED_ROOT_FOLDER' no existe o no es un directorio."
        exit 1
    fi
    # Convertir a ruta absoluta
    SELECTED_ROOT_FOLDER="$(cd "$SELECTED_ROOT_FOLDER" && pwd)"


    echo "Operando sobre el directorio raíz del proyecto:"
    echo "$SELECTED_ROOT_FOLDER"
    echo "-----------------------------------------------------"
    
    # process_file_selection hace 'cd' a SELECTED_ROOT_FOLDER y vuelve al original
    if ! process_file_selection; then
        if [[ ${#FINAL_SELECTED_FILES[@]} -eq 0 ]]; then
             echo "Proceso de selección de archivos fallido o cancelado sin seleccionar archivos."
        fi
        # Asegurarse de estar en el CWD inicial si process_file_selection falla antes de su cd de retorno
        cd "$initial_cwd" 
        exit 1
    fi

    # Volver al CWD inicial antes de generar el archivo de salida si el usuario no dio ruta absoluta
    cd "$initial_cwd"

    if [[ ${#FINAL_SELECTED_FILES[@]} -eq 0 ]]; then
        echo "No se seleccionaron archivos para exportar. Saliendo."
    else
        if ! export_content_to_markdown; then # Esta función ahora maneja su propio cd
             echo "Hubo un error durante la exportación a Markdown."
             exit 1
        fi
    fi
    
    echo "Script finalizado."
}

# Llamar a main solo si el script es ejecutado, no si es sourced (aunque no es común para este tipo de script)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi