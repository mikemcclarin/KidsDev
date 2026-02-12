extends CharacterBody2D

@export var speed = 200
var start_pos: Vector2
var lives = 10
var level = 1
var game_manager

func _ready():
	add_to_group("player")
	start_pos = position
	game_manager = get_tree().get_first_node_in_group("game_manager")
	if game_manager:
		game_manager.update_lives(lives)
		game_manager.update_level(level)

func _physics_process(delta):
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = input_dir * speed
	move_and_collide(velocity * delta)

func lose_life():
	lives -= 1
	if game_manager:
		game_manager.update_lives(lives)
	if lives <= 0:
		game_over()
	else:
		respawn()

func gain_life():
	lives = min(lives + 1, 10)  # Cap at 10 lives
	if game_manager:
		game_manager.update_lives(lives)

func respawn():
	position = start_pos

func level_complete():
	level += 1
	if game_manager:
		game_manager.level_complete(level)

func game_over():
	if game_manager:
		game_manager.game_over()
