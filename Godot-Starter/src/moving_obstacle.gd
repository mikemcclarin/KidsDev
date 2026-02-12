extends Node2D
# Moving obstacle that walks back and forth

@export var speed = 100
@export var move_range = 100

var direction = 1
var start_pos: Vector2

func _ready():
	start_pos = position

func _process(delta):
	position.x += direction * speed * delta
	
	# Check if we've exceeded move range
	if abs(position.x - start_pos.x) > move_range:
		direction *= -1
