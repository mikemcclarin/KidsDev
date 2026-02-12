extends CharacterBody2D
# Simple enemy that patrols and harms player on contact

@export var speed = 80
@export var patrol_range = 150

var direction = 1
var start_pos: Vector2
var damage_cooldown = 0

func _ready():
	add_to_group("enemy")
	start_pos = position

func _physics_process(delta):
	# Patrol movement
	velocity.x = direction * speed
	move_and_slide()
	
	# Check patrol bounds
	if abs(position.x - start_pos.x) > patrol_range:
		direction *= -1
	
	# Check collision with player
	for i in range(get_slide_collision_count()):
		var collision = get_slide_collision(i)
		if collision.get_collider().is_in_group("player") and damage_cooldown <= 0:
			collision.get_collider().lose_life()
			damage_cooldown = 1.0
	
	if damage_cooldown > 0:
		damage_cooldown -= delta
