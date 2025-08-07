// src/lib.rs
use std::{fs, path::{Path, PathBuf}};
use directories::ProjectDirs;
use chrono::Local;
use serde_json::Value;
use tauri::{command, AppHandle};

/// Проверяет наличие data.json в каталоге данных приложения;
/// если нет — создаёт папку и файл с пустым JSON `{}`.
#[command]
fn check_data_file(_app_handle: AppHandle) -> Result<String, String> {
    // Инициализируем ProjectDirs:
    // "com" — организация, "SortApp" — издатель, "SortApp" — имя приложения
    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    // Получаем путь к каталогу данных как &Path
    let base_dir: &Path = proj_dirs.data_dir();

    // Убедимся, что папка существует
    fs::create_dir_all(base_dir)
        .map_err(|e| format!("Не удалось создать папку {:?}: {}", base_dir, e))?;

    // Собираем полный путь до data.json
    let file_path: PathBuf = base_dir.join("data.json");

    if file_path.exists() {
        Ok(format!("Файл найден: {}", file_path.display()))
    } else {
        // Создаём файл с пустым JSON
        fs::write(&file_path, "{}")
            .map_err(|e| format!("Не удалось создать файл {:?}: {}", file_path, e))?;
        Ok(format!("Файл не найден. Создан новый: {}", file_path.display()))
    }
}


#[command]
fn check_today_exists(_app_handle: AppHandle) -> Result<bool, String> {
    // Получаем путь до файла
    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let base_dir: &Path = proj_dirs.data_dir();
    let file_path: PathBuf = base_dir.join("data.json");

    // Читаем содержимое файла
    let file_content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Не удалось прочитать файл {:?}: {}", file_path, e))?;

    // Парсим JSON
    let json_data: Value = serde_json::from_str(&file_content)
        .map_err(|e| format!("Ошибка при парсинге JSON: {}", e))?;

    // Получаем сегодняшнюю дату в формате dd.mm.yyyy
    let today = Local::now().format("%d.%m.%Y").to_string();

    // Проверяем, есть ли ключ с сегодняшней датой
    Ok(json_data.get(&today).is_some())
}

#[command]
fn add_today_date(_app_handle: AppHandle) -> Result<(), String> {
    use std::collections::BTreeMap;
    use serde_json::{Map, Value};

    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let base_dir = proj_dirs.data_dir();
    let file_path = base_dir.join("data.json");

    // Читаем текущий JSON
    let file_content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Не удалось прочитать файл: {}", e))?;

    // Парсим в Map
    let mut json_data: Map<String, Value> = serde_json::from_str(&file_content)
        .map_err(|e| format!("Ошибка парсинга JSON: {}", e))?;

    // Сегодняшняя дата
    let today = Local::now().format("%d.%m.%Y").to_string();

    // Если даты ещё нет — добавим её
    if !json_data.contains_key(&today) {
        // Добавляем начальные значения
        let mut day_data = Map::new();
        day_data.insert("work".to_string(), Value::String("0:00".to_string()));
        day_data.insert("relax".to_string(), Value::String("0:00".to_string()));
        day_data.insert("tasks".to_string(), Value::String("0/0".to_string()));

        json_data.insert(today, Value::Object(day_data));
    }

    // Сохраняем обратно
    let updated = Value::Object(json_data);
    fs::write(&file_path, serde_json::to_string_pretty(&updated).unwrap())
        .map_err(|e| format!("Не удалось сохранить файл: {}", e))?;

    Ok(())
}


#[command]
fn increment_today_time(label: String, _app_handle: AppHandle) -> Result<(), String> {
    use serde_json::{Map, Value};

    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let file_path = proj_dirs.data_dir().join("data.json");

    // Чтение и парсинг
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Не удалось прочитать файл: {}", e))?;
    let mut json_data: Map<String, Value> = serde_json::from_str(&content)
        .map_err(|e| format!("Ошибка при парсинге JSON: {}", e))?;

    let today = Local::now().format("%d.%m.%Y").to_string();

    let entry = json_data
        .get_mut(&today)
        .ok_or("Нет записи на сегодняшнюю дату")?
        .as_object_mut()
        .ok_or("Неверный формат записи")?;

    let key = match label.to_uppercase().as_str() {
        "WORK" => "work",
        "REST" => "relax",
        _ => return Err("Неверный тип label".to_string()),
    };

    // Получаем текущее значение, парсим и увеличиваем
    if let Some(Value::String(time_str)) = entry.get(key) {
        let parts: Vec<&str> = time_str.split(':').collect();
        let mut hours = parts.get(0).unwrap_or(&"0").parse::<u32>().unwrap_or(0);
        let mut minutes = parts.get(1).unwrap_or(&"0").parse::<u32>().unwrap_or(0);

        minutes += 1;
        if minutes >= 60 {
            minutes = 0;
            hours += 1;
        }

        let new_time = format!("{}:{:02}", hours, minutes);
        entry.insert(key.to_string(), Value::String(new_time));
    }

    // Сохраняем обратно
    fs::write(&file_path, serde_json::to_string_pretty(&json_data).unwrap())
        .map_err(|e| format!("Не удалось сохранить файл: {}", e))?;

    Ok(())
}
#[command]
fn get_today_time(label: String, _app_handle: AppHandle) -> Result<String, String> {
    use serde_json::Value;

    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let file_path = proj_dirs.data_dir().join("data.json");

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Не удалось прочитать файл: {}", e))?;
    let json_data: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Ошибка при парсинге JSON: {}", e))?;

    let today = Local::now().format("%d.%m.%Y").to_string();

    let day_data = json_data
        .get(&today)
        .ok_or("Нет записи на сегодняшнюю дату")?;

    let key = match label.to_uppercase().as_str() {
        "WORK" => "work",
        "REST" => "relax",
        _ => return Err("Неверный тип label".to_string()),
    };

    if let Some(Value::String(time_str)) = day_data.get(key) {
        Ok(time_str.clone())
    } else {
        Err("Время не найдено в данных".to_string())
    }
}
#[command]
fn get_today_tasks(_app_handle: AppHandle) -> Result<String, String> {
    use serde_json::Value;

    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let file_path = proj_dirs.data_dir().join("data.json");

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Не удалось прочитать файл: {}", e))?;
    let json_data: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Ошибка при парсинге JSON: {}", e))?;

    let today = chrono::Local::now().format("%d.%m.%Y").to_string();

    let day_data = json_data
        .get(&today)
        .ok_or("Нет записи на сегодняшнюю дату")?;

    if let Some(Value::String(tasks_str)) = day_data.get("tasks") {
        Ok(tasks_str.clone())
    } else {
        Err("Задачи не найдены в данных".to_string())
    }
}


#[command]
fn get_all_days(_app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let file_path = proj_dirs.data_dir().join("data.json");

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Не удалось прочитать файл: {}", e))?;

    let json_data: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Ошибка парсинга JSON: {}", e))?;

    Ok(json_data)
}


#[tauri::command]
fn update_today_tasks(completed: u32, total: u32) -> Result<(), String> {
    use chrono::Local;
    use serde_json::{json, Value};
    use std::{fs, path::PathBuf};
    use directories::ProjectDirs;

    let today = Local::now().format("%d.%m.%Y").to_string(); // чтобы дата совпадала с остальными

    let proj_dirs = ProjectDirs::from("com", "TimeApp", "TimeApp")
        .ok_or_else(|| "Не удалось определить директорию приложения".to_string())?;
    let data_file: PathBuf = proj_dirs.data_dir().join("data.json");

    let mut data: Value = if data_file.exists() {
        let content = fs::read_to_string(&data_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_else(|_| json!({}))
    } else {
        json!({})
    };

    data[today]["tasks"] = json!(format!("{}/{}", completed, total));

    fs::write(&data_file, serde_json::to_string_pretty(&data).unwrap())
        .map_err(|e| e.to_string())?;

    Ok(())
}




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_today_exists,
            check_data_file,
            add_today_date,
            increment_today_time,
            get_today_time, 
            get_today_tasks,
            get_all_days,
            update_today_tasks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
