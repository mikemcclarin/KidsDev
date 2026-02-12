extends CanvasLayer

@onready var lives_label = Label.new()
@onready var level_label = Label.new()
@onready var game_over_label = Label.new()
@onready var level_complete_label = Label.new()
var game_manager

func _ready():
	# Find game manager
	game_manager = get_tree().get_first_node_in_group("game_manager")
	
	# Setup lives label
	lives_label.text = "Lives: 10"
	lives_label.add_theme_font_size_override("font_size", 32)
	lives_label.position = Vector2(10, 10)
	add_child(lives_label)
	
	# Setup level label
	level_label.text = "Level: 1"
	level_label.add_theme_font_size_override("font_size", 32)
	level_label.position = Vector2(10, 50)
	add_child(level_label)
	
	# Setup game over label (hidden by default)
	game_over_label.text = "GAME OVER!"
	game_over_label.add_theme_font_size_override("font_size", 64)
	game_over_label.position = Vector2(200, 300)
	game_over_label.visible = false
	add_child(game_over_label)
	
	# Setup level complete label (hidden by default)
	level_complete_label.text = "LEVEL COMPLETE!"
	level_complete_label.add_theme_font_size_override("font_size", 64)
	level_complete_label.position = Vector2(150, 300)
	level_complete_label.visible = false
	add_child(level_complete_label)
	
	# Connect to GameManager signals
	if game_manager:
		game_manager.lives_changed.connect(_on_lives_changed)
		game_manager.level_changed.connect(_on_level_changed)
		game_manager.game_over.connect(_on_game_over)
		game_manager.level_completed.connect(_on_level_complete)

func _on_lives_changed(new_lives):
	lives_label.text = "Lives: %d" % new_lives

func _on_level_changed(new_level):
	level_label.text = "Level: %d" % new_level

func _on_game_over():
	game_over_label.visible = true

func _on_level_complete():
	level_complete_label.visible = true
