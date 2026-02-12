extends CharacterBody2D

@export var speed = 200

func _ready():
	print("Player ready! Use arrow keys or WASD to move.")

func _physics_process(delta):
	# Get input
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	
	# Move
	velocity = input_dir * speed
	move_and_collide(velocity * delta)
	
	# Optional: Flip sprite based on direction
	if input_dir.x != 0:
		scale.x = sign(input_dir.x)
