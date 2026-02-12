extends CharacterBody2D

@export var speed = 200
var start_pos: Vector2
var lives = 10
var level = 1

func _ready():
	add_to_group("player")
	start_pos = position
	GameManager.update_lives(lives)
	GameManager.update_level(level)

func _physics_process(delta):
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = input_dir * speed
	move_and_collide(velocity * delta)

func lose_life():
	lives -= 1
	GameManager.update_lives(lives)
	if lives <= 0:
		game_over()
	else:
		respawn()

func gain_life():
	lives = min(lives + 1, 10)  # Cap at 10 lives
	GameManager.update_lives(lives)

func respawn():
	position = start_pos

func level_complete():
	level += 1
	GameManager.level_complete(level)

func game_over():
	GameManager.game_over()
