extends Node
# Game manager for lives, level, UI updates

signal lives_changed(new_lives)
signal level_changed(new_level)
signal level_completed
signal game_over

func _ready():
	add_to_group("game_manager")

func update_lives(new_lives):
	lives_changed.emit(new_lives)

func update_level(new_level):
	level_changed.emit(new_level)

func level_complete(next_level):
	level_completed.emit()
	await get_tree().create_timer(2.0).timeout
	get_tree().change_scene_to_file("res://scenes/main.tscn")  # Reload for now

func game_over():
	game_over.emit()
	await get_tree().create_timer(3.0).timeout
	get_tree().change_scene_to_file("res://scenes/main.tscn")  # Restart
